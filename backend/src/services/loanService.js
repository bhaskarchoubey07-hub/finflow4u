const {
  LoanStatus,
  RepaymentStatus,
  ReviewStatus,
  NotificationChannel,
  WalletType,
  LedgerAccountType,
  LedgerEntryDirection
} = require("@prisma/client");
const prisma = require("../config/prisma");
const { calculateEmi } = require("../utils/emi");
const { evaluateBorrower } = require("./creditScoreService");
const { logTransaction } = require("../utils/logger");
const { notifyUser } = require("./notificationService");
const { ensureWalletWithAccounts, postTransfer } = require("./ledgerService");

async function createLoanApplication(userId, payload) {
  const evaluation = await evaluateBorrower({
    annualIncome: Number(payload.annualIncome),
    existingDebt: Number(payload.existingDebt),
    employmentStatus: payload.employmentStatus,
    loanAmount: Number(payload.amount),
    termMonths: Number(payload.termMonths)
  });

  const emiAmount = calculateEmi(
    Number(payload.amount),
    evaluation.interestRate,
    Number(payload.termMonths)
  );

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { creditScore: evaluation.creditScore }
    });

    const loan = await tx.loanRequest.create({
      data: {
        borrowerId: userId,
        amount: Number(payload.amount),
        interestRate: evaluation.interestRate,
        riskGrade: evaluation.riskGrade,
        status:
          evaluation.reviewStatus === ReviewStatus.REJECTED ? LoanStatus.REJECTED : LoanStatus.PENDING,
        purpose: payload.purpose,
        termMonths: Number(payload.termMonths),
        annualIncome: Number(payload.annualIncome),
        existingDebt: Number(payload.existingDebt),
        employmentStatus: payload.employmentStatus,
        emiAmount,
        probabilityOfDefault: evaluation.probabilityOfDefault,
        riskBand: evaluation.riskBand,
        decisionReason: evaluation.decisionReason,
        recommendedRate: evaluation.interestRate,
        reviewStatus: evaluation.reviewStatus
      }
    });

    const repaymentEntries = Array.from({ length: Number(payload.termMonths) }).map((_, index) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + index + 1);
      dueDate.setDate(5);

      return {
        loanId: loan.id,
        amountPaid: emiAmount,
        dueDate,
        status: RepaymentStatus.PENDING
      };
    });

    await tx.repayment.createMany({ data: repaymentEntries });

    return { loan, evaluation, emiAmount };
  });

  logTransaction("loan_application_created", {
    borrowerId: userId,
    loanId: result.loan.id,
    amount: payload.amount,
    riskGrade: result.evaluation.riskGrade,
    recommendation: result.evaluation.recommendation
  });

  await notifyUser(userId, {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    type: "loan-submitted",
    subject: "Loan application submitted",
    message:
      result.evaluation.reviewStatus === ReviewStatus.REJECTED
        ? "Your application was flagged as too risky and is marked rejected pending further review."
        : "Your loan application has been submitted for admin review."
  });

  return result;
}

async function listMarketplaceLoans() {
  const loans = await prisma.loanRequest.findMany({
    where: {
      OR: [{ status: LoanStatus.ACTIVE }, { status: LoanStatus.FUNDED }],
      reviewStatus: ReviewStatus.APPROVED
    },
    include: {
      borrower: {
        select: {
          id: true,
          name: true,
          creditScore: true
        }
      },
      investments: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return loans.map((loan) => {
    const fundedAmount = loan.investments.reduce(
      (sum, investment) => sum + Number(investment.amountInvested),
      0
    );

    return {
      id: loan.id,
      borrower: loan.borrower,
      amount: Number(loan.amount),
      interestRate: Number(loan.interestRate),
      riskGrade: loan.riskGrade,
      status: loan.status,
      reviewStatus: loan.reviewStatus,
      purpose: loan.purpose,
      termMonths: loan.termMonths,
      emiAmount: Number(loan.emiAmount),
      probabilityOfDefault: Number(loan.probabilityOfDefault || 0),
      riskBand: loan.riskBand,
      decisionReason: loan.decisionReason,
      fundedAmount,
      remainingAmount: Number(loan.amount) - fundedAmount,
      expectedReturn: Number((Number(loan.amount) * Number(loan.interestRate)) / 100).toFixed(2),
      createdAt: loan.createdAt
    };
  });
}

async function getBorrowerLoans(userId) {
  return prisma.loanRequest.findMany({
    where: { borrowerId: userId },
    include: {
      investments: true,
      repayments: {
        orderBy: { dueDate: "asc" }
      },
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

async function getPendingLoansForAdmin() {
  return prisma.loanRequest.findMany({
    where: {
      reviewStatus: ReviewStatus.PENDING
    },
    include: {
      borrower: {
        select: {
          id: true,
          name: true,
          email: true,
          creditScore: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

async function reviewLoanApplication(loanId, reviewerId, payload) {
  const reviewStatus = payload.reviewStatus;
  const approved = reviewStatus === ReviewStatus.APPROVED;

  const updatedLoan = await prisma.$transaction(async (tx) => {
    const loan = await tx.loanRequest.findUnique({
      where: { id: loanId },
      include: {
        borrower: true
      }
    });

    if (!loan) {
      const error = new Error("Loan application not found.");
      error.statusCode = 404;
      throw error;
    }

    const nextStatus = approved ? LoanStatus.ACTIVE : LoanStatus.REJECTED;
    const reviewer = await tx.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, name: true, email: true }
    });

    const updateData = {
      reviewStatus,
      reviewNotes: payload.reviewNotes,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      status: nextStatus
    };

    let newEmiAmount;
    if (approved && payload.overrideRate !== undefined) {
      updateData.interestRate = payload.overrideRate;
      updateData.recommendedRate = payload.overrideRate;
      newEmiAmount = calculateEmi(Number(loan.amount), payload.overrideRate, loan.termMonths);
      updateData.emiAmount = newEmiAmount;
    }
    if (approved && payload.overrideGrade !== undefined) {
      updateData.riskGrade = payload.overrideGrade;
    }
    if (approved && payload.overridePD !== undefined) {
      updateData.probabilityOfDefault = payload.overridePD;
    }

    if (approved && payload.overrideScore !== undefined) {
      await tx.user.update({
        where: { id: loan.borrowerId },
        data: { creditScore: payload.overrideScore }
      });
    }

    if (newEmiAmount !== undefined) {
      await tx.repayment.updateMany({
        where: { loanId: loan.id, status: RepaymentStatus.PENDING },
        data: { amountPaid: newEmiAmount }
      });
    }

    const updated = await tx.loanRequest.update({
      where: { id: loanId },
      data: updateData,
      include: {
        borrower: true,
        reviewer: true
      }
    });

    if (approved) {
      const platformWallet = await ensureWalletWithAccounts(tx, {
        walletType: WalletType.PLATFORM
      });
      const borrowerWallet = await ensureWalletWithAccounts(tx, {
        walletType: WalletType.BORROWER,
        userId: loan.borrowerId
      });

      const platformFundingAccount = platformWallet.accounts.find(
        (account) => account.type === LedgerAccountType.FUNDING_HOLD
      );
      const borrowerPayableAccount = borrowerWallet.accounts.find(
        (account) => account.type === LedgerAccountType.BORROWER_PAYABLE
      );

      await postTransfer(tx, {
        description: "Loan approved and borrower payable recorded",
        amount: loan.amount,
        referenceType: "LOAN_APPROVAL",
        loanId: loan.id,
        entries: [
          {
            walletId: platformWallet.id,
            ledgerAccountId: platformFundingAccount.id,
            amount: loan.amount,
            direction: LedgerEntryDirection.DEBIT,
            memo: "Platform funding pool reserved for borrower disbursal"
          },
          {
            walletId: borrowerWallet.id,
            ledgerAccountId: borrowerPayableAccount.id,
            amount: loan.amount,
            direction: LedgerEntryDirection.CREDIT,
            memo: "Borrower payable created on approval"
          }
        ]
      });
    }

    return {
      ...updated,
      reviewer
    };
  });

  await notifyUser(updatedLoan.borrowerId, {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    type: approved ? "loan-approved" : "loan-rejected",
    subject: approved ? "Loan approved" : "Loan review update",
    message: approved
      ? `Your loan was approved by ${updatedLoan.reviewer?.name || "the admin team"} and is now live.`
      : `Your loan was marked ${reviewStatus.toLowerCase().replaceAll("_", " ")}. ${payload.reviewNotes || ""}`.trim()
  });

  return updatedLoan;
}

async function getAdminAnalytics() {
  const [pendingApplications, approvedApplications, rejectedApplications, defaultedLoans, fundedLoans, notifications] =
    await Promise.all([
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.PENDING } }),
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.APPROVED } }),
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.REJECTED } }),
      prisma.loanRequest.count({ where: { status: LoanStatus.DEFAULTED } }),
      prisma.loanRequest.findMany({
        where: { reviewStatus: ReviewStatus.APPROVED },
        select: { amount: true }
      }),
      prisma.notification.count()
    ]);

  const [overdueRepayments, platformWallet] = await Promise.all([
    prisma.repayment.count({
      where: {
        status: RepaymentStatus.OVERDUE
      }
    }),
    prisma.wallet.findFirst({
      where: {
        type: WalletType.PLATFORM,
        userId: null
      },
      include: { accounts: true }
    })
  ]);

  return {
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    defaultedLoans,
    overdueRepayments,
    notificationsSent: notifications,
    totalReviewedCapital: fundedLoans.reduce((sum, loan) => sum + Number(loan.amount), 0),
    platformWalletBalance: Number(platformWallet?.balance || 0)
  };
}

module.exports = {
  createLoanApplication,
  listMarketplaceLoans,
  getBorrowerLoans,
  getPendingLoansForAdmin,
  reviewLoanApplication,
  getAdminAnalytics
};

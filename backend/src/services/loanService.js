const { LoanStatus, RepaymentStatus, ReviewStatus, NotificationChannel } = require("@prisma/client");
const prisma = require("../config/prisma");
const { calculateEmi } = require("../utils/emi");
const { evaluateBorrower } = require("./creditScoreService");
const { logTransaction } = require("../utils/logger");
const { notifyUser } = require("./notificationService");

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

    const updated = await tx.loanRequest.update({
      where: { id: loanId },
      data: {
        reviewStatus,
        reviewNotes: payload.reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        status: nextStatus
      },
      include: {
        borrower: true,
        reviewer: {
          select: { name: true, email: true }
        }
      }
    });

    return updated;
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
  const [pendingApplications, approvedApplications, rejectedApplications, defaultedLoans, fundedLoans] =
    await Promise.all([
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.PENDING } }),
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.APPROVED } }),
      prisma.loanRequest.count({ where: { reviewStatus: ReviewStatus.REJECTED } }),
      prisma.loanRequest.count({ where: { status: LoanStatus.DEFAULTED } }),
      prisma.loanRequest.findMany({
        where: { reviewStatus: ReviewStatus.APPROVED },
        select: { amount: true }
      })
    ]);

  return {
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    defaultedLoans,
    totalReviewedCapital: fundedLoans.reduce((sum, loan) => sum + Number(loan.amount), 0)
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

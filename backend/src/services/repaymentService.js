const {
  LoanStatus,
  RepaymentStatus,
  WalletType,
  LedgerAccountType,
  LedgerEntryDirection
} = require("@prisma/client");
const prisma = require("../config/prisma");
const { logTransaction } = require("../utils/logger");
const { ensureWalletWithAccounts, postTransfer } = require("./ledgerService");

async function processRepayment({ borrowerId, loanId, amountPaid }) {
  const amount = Number(amountPaid);

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loanRequest.findUnique({
      where: { id: loanId },
      include: {
        repayments: {
          orderBy: { dueDate: "asc" }
        },
        investments: {
          include: {
            lender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!loan) {
      const error = new Error("Loan not found.");
      error.statusCode = 404;
      throw error;
    }

    if (loan.borrowerId !== borrowerId) {
      const error = new Error("You can only pay repayments for your own loans.");
      error.statusCode = 403;
      throw error;
    }

    // We always settle the oldest overdue or pending installment first.
    const dueRepayment =
      loan.repayments.find((item) => item.status === RepaymentStatus.OVERDUE) ||
      loan.repayments.find((item) => item.status === RepaymentStatus.PENDING);

    if (!dueRepayment) {
      const error = new Error("No pending repayments left for this loan.");
      error.statusCode = 400;
      throw error;
    }

    await tx.repayment.update({
      where: { id: dueRepayment.id },
      data: {
        amountPaid: amount,
        paidAt: new Date(),
        status: RepaymentStatus.PAID
      }
    });

    const platformWallet = await ensureWalletWithAccounts(tx, {
      walletType: WalletType.PLATFORM
    });
    const borrowerWallet = await ensureWalletWithAccounts(tx, {
      walletType: WalletType.BORROWER,
      userId: borrowerId
    });

    const borrowerPayable = borrowerWallet.accounts.find(
      (account) => account.type === LedgerAccountType.BORROWER_PAYABLE
    );
    const platformCash = platformWallet.accounts.find((account) => account.type === LedgerAccountType.CASH);
    const platformInterestRevenue = platformWallet.accounts.find(
      (account) => account.type === LedgerAccountType.INTEREST_REVENUE
    );

    const interestPortion = Number((amount * 0.18).toFixed(2));
    const principalPortion = Number((amount - interestPortion).toFixed(2));

    await postTransfer(tx, {
      description: "Borrower repayment collected and recognized",
      amount,
      referenceType: "REPAYMENT",
      loanId,
      repaymentId: dueRepayment.id,
      entries: [
        {
          walletId: borrowerWallet.id,
          ledgerAccountId: borrowerPayable.id,
          amount: principalPortion,
          direction: LedgerEntryDirection.DEBIT,
          memo: "Borrower payable reduced by principal repayment"
        },
        {
          walletId: platformWallet.id,
          ledgerAccountId: platformCash.id,
          amount: principalPortion,
          direction: LedgerEntryDirection.DEBIT,
          memo: "Platform cash increased by principal collected"
        },
        {
          walletId: platformWallet.id,
          ledgerAccountId: platformInterestRevenue.id,
          amount: interestPortion,
          direction: LedgerEntryDirection.DEBIT,
          memo: "Interest revenue recognized"
        }
      ]
    });

    const now = new Date();
    const remainingRepayments = loan.repayments.filter((item) => item.id !== dueRepayment.id);
    const overdueItems = remainingRepayments.filter(
      (item) => item.status !== RepaymentStatus.PAID && new Date(item.dueDate) < now
    );

    for (const repayment of overdueItems) {
      await tx.repayment.update({
        where: { id: repayment.id },
        data: { status: RepaymentStatus.OVERDUE }
      });
    }

    // Smart-contract style fallback: after two missed dues, the loan defaults and lenders are notified.
    if (overdueItems.length > 2) {
      await tx.loanRequest.update({
        where: { id: loanId },
        data: { status: LoanStatus.DEFAULTED }
      });

      await tx.repayment.updateMany({
        where: {
          loanId,
          status: {
            in: [RepaymentStatus.PENDING, RepaymentStatus.OVERDUE]
          }
        },
        data: {
          status: RepaymentStatus.DEFAULTED
        }
      });

      logTransaction("loan_defaulted_notify_lenders", {
        loanId,
        lenders: loan.investments.map((investment) => investment.lender.email)
      });
    }

    const unpaidCount = await tx.repayment.count({
      where: {
        loanId,
        status: {
          in: [RepaymentStatus.PENDING, RepaymentStatus.OVERDUE, RepaymentStatus.DEFAULTED]
        }
      }
    });

    if (unpaidCount === 0) {
      await tx.loanRequest.update({
        where: { id: loanId },
        data: { status: LoanStatus.CLOSED }
      });
    }

    logTransaction("loan_repayment_processed", {
      loanId,
      repaymentId: dueRepayment.id,
      amountPaid: amount
    });

    return { repaymentId: dueRepayment.id, amountPaid: amount };
  });
}

module.exports = {
  processRepayment
};

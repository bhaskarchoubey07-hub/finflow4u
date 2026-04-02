const { LoanStatus, WalletType, LedgerAccountType, LedgerEntryDirection } = require("@prisma/client");
const prisma = require("../config/prisma");
const { logTransaction } = require("../utils/logger");
const { ensureWalletWithAccounts, getWalletSnapshot, postTransfer } = require("./ledgerService");

async function investInLoan(lenderId, { loanId, amountInvested }) {
  const amount = Number(amountInvested);

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loanRequest.findUnique({
      where: { id: loanId },
      include: { investments: true }
    });

    if (!loan) {
      const error = new Error("Loan not found.");
      error.statusCode = 404;
      throw error;
    }

    if (![LoanStatus.ACTIVE, LoanStatus.FUNDED].includes(loan.status)) {
      const error = new Error("This loan is no longer open for investment.");
      error.statusCode = 400;
      throw error;
    }

    const investedSoFar = loan.investments.reduce(
      (sum, item) => sum + Number(item.amountInvested),
      0
    );
    const remaining = Number(loan.amount) - investedSoFar;

    if (amount > remaining) {
      const error = new Error(`Investment exceeds remaining amount of ${remaining.toFixed(2)}.`);
      error.statusCode = 400;
      throw error;
    }

    const investment = await tx.investment.create({
      data: {
        lenderId,
        loanId,
        amountInvested: amount
      }
    });

    const platformWallet = await ensureWalletWithAccounts(tx, {
      walletType: WalletType.PLATFORM
    });
    const lenderWallet = await ensureWalletWithAccounts(tx, {
      walletType: WalletType.LENDER,
      userId: lenderId
    });

    const lenderCash = lenderWallet.accounts.find((account) => account.type === LedgerAccountType.CASH);
    const lenderFundingHold = lenderWallet.accounts.find(
      (account) => account.type === LedgerAccountType.FUNDING_HOLD
    );
    const platformFundingHold = platformWallet.accounts.find(
      (account) => account.type === LedgerAccountType.FUNDING_HOLD
    );

    await postTransfer(tx, {
      description: "Lender investment committed to loan funding pool",
      amount,
      referenceType: "INVESTMENT",
      loanId,
      investmentId: investment.id,
      entries: [
        {
          walletId: lenderWallet.id,
          ledgerAccountId: lenderCash.id,
          amount,
          direction: LedgerEntryDirection.CREDIT,
          memo: "Lender cash reduced by investment commitment"
        },
        {
          walletId: lenderWallet.id,
          ledgerAccountId: lenderFundingHold.id,
          amount,
          direction: LedgerEntryDirection.DEBIT,
          memo: "Lender funds moved to committed capital"
        },
        {
          walletId: platformWallet.id,
          ledgerAccountId: platformFundingHold.id,
          amount,
          direction: LedgerEntryDirection.DEBIT,
          memo: "Platform funding pool increased by lender commitment"
        }
      ]
    });

    if (amount === remaining) {
      await tx.loanRequest.update({
        where: { id: loanId },
        data: { status: LoanStatus.FUNDED }
      });
    }

    logTransaction("loan_investment_created", {
      lenderId,
      loanId,
      amountInvested: amount
    });

    return investment;
  });
}

async function getLenderPortfolio(lenderId) {
  const investments = await prisma.investment.findMany({
    where: { lenderId },
    include: {
      loan: {
        include: {
          borrower: {
            select: { name: true, creditScore: true }
          },
          repayments: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const summary = investments.reduce(
    (acc, investment) => {
      const principal = Number(investment.amountInvested);
      const interest = (principal * Number(investment.loan.interestRate)) / 100;
      const paidRepayments = investment.loan.repayments.filter((item) => item.status === "PAID").length;

      acc.totalInvested += principal;
      acc.expectedReturns += interest;
      acc.activeInvestments += 1;
      acc.repaymentsReceived += paidRepayments * Number(investment.loan.emiAmount);

      return acc;
    },
    {
      totalInvested: 0,
      expectedReturns: 0,
      activeInvestments: 0,
      repaymentsReceived: 0
    }
  );

  const wallet = await getWalletSnapshot(prisma, {
    walletType: WalletType.LENDER,
    userId: lenderId
  });

  return {
    summary,
    wallet: wallet
      ? {
          balance: Number(wallet.balance),
          accounts: wallet.accounts.map((account) => ({
            type: account.type,
            balance: Number(account.balance)
          }))
        }
      : null,
    investments: investments.map((investment) => ({
      id: investment.id,
      amountInvested: Number(investment.amountInvested),
      createdAt: investment.createdAt,
      loan: {
        id: investment.loan.id,
        amount: Number(investment.loan.amount),
        interestRate: Number(investment.loan.interestRate),
        riskGrade: investment.loan.riskGrade,
        riskBand: investment.loan.riskBand,
        probabilityOfDefault: Number(investment.loan.probabilityOfDefault || 0),
        status: investment.loan.status,
        emiAmount: Number(investment.loan.emiAmount),
        borrower: investment.loan.borrower
      }
    }))
  };
}

module.exports = {
  investInLoan,
  getLenderPortfolio
};

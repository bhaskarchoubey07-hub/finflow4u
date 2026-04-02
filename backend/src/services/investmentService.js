const { LoanStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const { logTransaction } = require("../utils/logger");

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

  return {
    summary,
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

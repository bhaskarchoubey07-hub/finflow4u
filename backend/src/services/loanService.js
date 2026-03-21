const { LoanStatus, RepaymentStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const { calculateEmi } = require("../utils/emi");
const { evaluateBorrower } = require("./creditScoreService");
const { logTransaction } = require("../utils/logger");

async function createLoanApplication(userId, payload) {
  const evaluation = await evaluateBorrower({
    annualIncome: Number(payload.annualIncome),
    existingDebt: Number(payload.existingDebt),
    employmentStatus: payload.employmentStatus,
    loanAmount: Number(payload.amount)
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
        status: LoanStatus.ACTIVE,
        purpose: payload.purpose,
        termMonths: Number(payload.termMonths),
        annualIncome: Number(payload.annualIncome),
        existingDebt: Number(payload.existingDebt),
        employmentStatus: payload.employmentStatus,
        emiAmount
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
    riskGrade: result.evaluation.riskGrade
  });

  return result;
}

async function listMarketplaceLoans() {
  const loans = await prisma.loanRequest.findMany({
    where: {
      status: {
        in: [LoanStatus.ACTIVE, LoanStatus.FUNDED]
      }
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
      purpose: loan.purpose,
      termMonths: loan.termMonths,
      emiAmount: Number(loan.emiAmount),
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
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

module.exports = {
  createLoanApplication,
  listMarketplaceLoans,
  getBorrowerLoans
};

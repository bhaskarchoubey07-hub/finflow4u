const prisma = require("../config/prisma");
const { LoanStatus } = require("@prisma/client");

/**
 * Loan Matching Engine
 * Recommends loans to lenders based on their risk and return preferences.
 */
async function getRecommendedLoansForLender(lenderId) {
  const preferences = await prisma.lenderPreference.findUnique({
    where: { lenderId }
  });

  if (!preferences) {
    // Return all active loans if no preferences are set
    return prisma.loanRequest.findMany({
      where: {
        status: LoanStatus.ACTIVE
      },
      include: {
        borrower: {
          select: { name: true, creditScore: true }
        }
      },
      take: 20
    });
  }

  // Find matching loans
  const matchingLoans = await prisma.loanRequest.findMany({
    where: {
      status: LoanStatus.ACTIVE,
      riskGrade: {
        in: preferences.riskGrades
      },
      interestRate: {
        gte: preferences.minReturn
      },
      termMonths: {
        lte: preferences.maxDuration
      }
    },
    include: {
      borrower: {
        select: { name: true, creditScore: true }
      }
    },
    orderBy: {
      interestRate: 'desc'
    }
  });

  return matchingLoans;
}

/**
 * Update Lender Preferences
 */
async function updateLenderPreferences(lenderId, data) {
  return prisma.lenderPreference.upsert({
    where: { lenderId },
    update: {
      riskGrades: data.riskGrades,
      minReturn: data.minReturn,
      maxDuration: data.maxDuration
    },
    create: {
      lenderId,
      riskGrades: data.riskGrades,
      minReturn: data.minReturn,
      maxDuration: data.maxDuration
    }
  });
}

module.exports = {
  getRecommendedLoansForLender,
  updateLenderPreferences
};

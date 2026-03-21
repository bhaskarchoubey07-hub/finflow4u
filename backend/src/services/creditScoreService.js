const { calculateCreditScore, mapRiskPricing } = require("../utils/scoring");

async function evaluateBorrower(financials) {
  const creditScore = calculateCreditScore(financials);
  const pricing = mapRiskPricing(creditScore);

  return {
    creditScore,
    ...pricing
  };
}

module.exports = {
  evaluateBorrower
};

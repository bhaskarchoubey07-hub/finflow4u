function calculateCreditScore({ annualIncome, existingDebt, employmentStatus, loanAmount }) {
  const debtRatio = existingDebt / Math.max(annualIncome, 1);
  const affordability = loanAmount / Math.max(annualIncome, 1);

  let score = 620;

  if (annualIncome >= 50000) score += 90;
  else if (annualIncome >= 25000) score += 55;
  else score += 20;

  if (debtRatio < 0.15) score += 70;
  else if (debtRatio < 0.3) score += 40;
  else score -= 20;

  if (affordability < 0.2) score += 40;
  else if (affordability < 0.45) score += 15;
  else score -= 35;

  if (employmentStatus.toLowerCase().includes("full")) score += 35;
  if (employmentStatus.toLowerCase().includes("self")) score += 15;

  return Math.max(300, Math.min(850, Math.round(score)));
}

function mapRiskPricing(creditScore) {
  if (creditScore > 750) {
    return { riskGrade: "A", interestRate: 8.5 };
  }

  if (creditScore >= 650) {
    return { riskGrade: "B", interestRate: 11.5 };
  }

  return { riskGrade: "C", interestRate: 16.75 };
}

module.exports = {
  calculateCreditScore,
  mapRiskPricing
};

const { ReviewStatus } = require("@prisma/client");
const { analyzeBorrower } = require("./riskAnalysisService");

async function evaluateBorrower(financials) {
  const analysis = analyzeBorrower(financials);

  return {
    creditScore: analysis.creditScore,
    interestRate: analysis.recommendedRate,
    riskGrade: analysis.riskGrade,
    riskBand: analysis.riskBand,
    probabilityOfDefault: analysis.probabilityOfDefault,
    decisionReason: analysis.decisionReason,
    recommendation: analysis.recommendation,
    metrics: analysis.metrics,
    reviewStatus:
      analysis.recommendation === "REJECT"
        ? ReviewStatus.REJECTED
        : ReviewStatus.PENDING
  };
}

module.exports = {
  evaluateBorrower
};

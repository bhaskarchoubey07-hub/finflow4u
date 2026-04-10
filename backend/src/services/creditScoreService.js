const { ReviewStatus } = require("@prisma/client");
const { analyzeBorrower } = require("./riskAnalysisService");
const axios = require("axios");

async function evaluateBorrower(financials) {
  let analysis;
  
  try {
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
      annual_income: financials.annualIncome,
      existing_debt: financials.existingDebt,
      loan_amount: financials.loanAmount,
      employment_years: 5, // Default for now, should be in financials
      credit_score: financials.creditScore || 700,
      term_months: financials.termMonths
    }, { timeout: 2000 });

    const mlData = mlResponse.data;
    
    analysis = {
      creditScore: mlData.credit_score_dynamic || financials.creditScore || 700,
      recommendedRate: mlData.risk_grade === 'A' ? 8.5 : mlData.risk_grade === 'B' ? 11.0 : mlData.risk_grade === 'C' ? 14.5 : 18.0,
      riskGrade: mlData.risk_grade,
      riskBand: mlData.probability_of_default < 0.1 ? "Low" : mlData.probability_of_default < 0.2 ? "Medium" : "High",
      probabilityOfDefault: mlData.probability_of_default * 100,
      decisionReason: `AI Prediction: ${mlData.recommendation}. Key factors: ${mlData.explanation.map(e => e.feature).join(', ')}`,
      recommendation: mlData.recommendation,
      metrics: financials
    };
  } catch (error) {
    console.warn("ML Service unavailable, falling back to rule-based analysis", error.message);
    analysis = analyzeBorrower(financials);
  }

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


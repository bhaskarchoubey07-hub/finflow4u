function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

function analyzeBorrower(financials) {
  const annualIncome = Number(financials.annualIncome);
  const existingDebt = Number(financials.existingDebt);
  const loanAmount = Number(financials.loanAmount);
  const termMonths = Number(financials.termMonths || 12);
  const employmentStatus = String(financials.employmentStatus || "");
  const age = Number(financials.age || 35);
  const creditHistoryLength = Number(financials.creditHistoryLength || 5);
  const numberOfExistingLoans = Number(financials.numberOfExistingLoans || 0);
  const latePaymentHistory = Number(financials.latePaymentHistory || 0);

  const debtToIncome = existingDebt / Math.max(annualIncome, 1);
  const loanToIncome = loanAmount / Math.max(annualIncome, 1);
  const monthlyIncome = annualIncome / 12;
  const requestedEmi = loanAmount / Math.max(termMonths, 1);
  const emiToIncome = requestedEmi / Math.max(monthlyIncome, 1);

  let score = 610;
  const reasons = [];

  if (annualIncome >= 70000) {
    score += 95;
    reasons.push("Strong annual income supports repayment capacity.");
  } else if (annualIncome >= 40000) {
    score += 65;
    reasons.push("Income profile is healthy for the requested amount.");
  } else if (annualIncome >= 25000) {
    score += 35;
    reasons.push("Income is serviceable but leaves less buffer.");
  } else {
    score -= 20;
    reasons.push("Lower income reduces repayment headroom.");
  }

  if (debtToIncome < 0.15) {
    score += 70;
    reasons.push("Debt-to-income ratio is comfortably low.");
  } else if (debtToIncome < 0.3) {
    score += 35;
    reasons.push("Debt-to-income ratio is acceptable.");
  } else if (debtToIncome < 0.45) {
    score -= 10;
    reasons.push("Debt-to-income ratio is elevated.");
  } else {
    score -= 60;
    reasons.push("Debt-to-income ratio is high and increases default risk.");
  }

  if (loanToIncome < 0.2) {
    score += 45;
  } else if (loanToIncome < 0.45) {
    score += 15;
  } else if (loanToIncome < 0.7) {
    score -= 15;
    reasons.push("Requested loan is relatively high versus annual income.");
  } else {
    score -= 45;
    reasons.push("Requested loan is very high relative to annual income.");
  }

  if (emiToIncome < 0.2) {
    score += 35;
  } else if (emiToIncome < 0.35) {
    score += 10;
  } else if (emiToIncome < 0.5) {
    score -= 20;
    reasons.push("Projected EMI consumes a large share of monthly income.");
  } else {
    score -= 50;
    reasons.push("Projected EMI is too heavy for the current income profile.");
  }

  if (/full/i.test(employmentStatus)) {
    score += 30;
    reasons.push("Full-time employment improves stability.");
  } else if (/self/i.test(employmentStatus)) {
    score += 10;
    reasons.push("Self-employment accepted with moderate volatility adjustment.");
  } else if (/contract|part/i.test(employmentStatus)) {
    score -= 10;
    reasons.push("Variable employment reduces score slightly.");
  }

  // --- Advanced Intelligence Factors ---
  
  // Age Scoring
  if (age < 21) {
    score -= 30;
    reasons.push("Younger applicants have limited financial history.");
  } else if (age > 60) {
    score -= 10;
    reasons.push("Proximity to retirement may affect long-term repayment.");
  }

  // Credit History Length
  if (creditHistoryLength > 10) {
    score += 60;
    reasons.push("Extensive credit history demonstrates long-term reliability.");
  } else if (creditHistoryLength < 2) {
    score -= 40;
    reasons.push("Insufficient credit history for a high-confidence verdict.");
  }

  // Late Payments
  if (latePaymentHistory === 0) {
    score += 50;
    reasons.push("Perfect payment track record is a strong positive indicator.");
  } else if (latePaymentHistory > 3) {
    score -= 100;
    reasons.push("Frequent late payments significantly increase default probability.");
  } else {
    score -= 30 * latePaymentHistory;
    reasons.push(`${latePaymentHistory} recorded late payments suggest moderate risk.`);
  }

  // Existing Debt Load
  if (numberOfExistingLoans > 3) {
    score -= 40;
    reasons.push("Multiple existing obligations may strain monthly cash flow.");
  }

  const creditScore = clamp(Math.round(score), 300, 850);

  let probabilityOfDefault;
  let riskGrade;
  let riskBand;
  let recommendedRate;
  let recommendation;

  if (creditScore >= 780) {
    probabilityOfDefault = 2.8;
    riskGrade = "A";
    riskBand = "Low";
    recommendedRate = 8.25;
    recommendation = "APPROVE";
  } else if (creditScore >= 720) {
    probabilityOfDefault = 5.4;
    riskGrade = "B";
    riskBand = "Moderate";
    recommendedRate = 10.75;
    recommendation = "APPROVE";
  } else if (creditScore >= 650) {
    probabilityOfDefault = 9.6;
    riskGrade = "C";
    riskBand = "Medium";
    recommendedRate = 13.5;
    recommendation = "APPROVE_WITH_CAUTION";
  } else if (creditScore >= 580) {
    probabilityOfDefault = 16.8;
    riskGrade = "D";
    riskBand = "High";
    recommendedRate = 17.9;
    recommendation = "REVIEW_MANUALLY";
    reasons.push("High-risk profile requires manual review before approval.");
  } else {
    probabilityOfDefault = 24.5;
    riskGrade = "E";
    riskBand = "Very High";
    recommendedRate = 22.5;
    recommendation = "REJECT";
    reasons.push("Default probability is above the approval tolerance.");
  }

  return {
    creditScore,
    probabilityOfDefault: roundToTwo(probabilityOfDefault),
    riskGrade,
    riskBand,
    recommendedRate: roundToTwo(recommendedRate),
    recommendation,
    decisionReason: reasons.join(" "),
    metrics: {
      debtToIncome: roundToTwo(debtToIncome * 100),
      loanToIncome: roundToTwo(loanToIncome * 100),
      emiToIncome: roundToTwo(emiToIncome * 100)
    }
  };
}

module.exports = {
  analyzeBorrower
};

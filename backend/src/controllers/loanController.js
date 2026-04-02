const {
  createLoanApplication,
  listMarketplaceLoans,
  getBorrowerLoans,
  getPendingLoansForAdmin,
  reviewLoanApplication,
  getAdminAnalytics
} = require("../services/loanService");

async function applyForLoan(req, res) {
  const result = await createLoanApplication(req.user.id, req.validated.body);

  return res.status(201).json({
    message: "Loan application submitted successfully.",
    creditScore: result.evaluation.creditScore,
    riskGrade: result.evaluation.riskGrade,
    riskBand: result.evaluation.riskBand,
    interestRate: result.evaluation.interestRate,
    probabilityOfDefault: result.evaluation.probabilityOfDefault,
    recommendation: result.evaluation.recommendation,
    reviewStatus: result.evaluation.reviewStatus,
    decisionReason: result.evaluation.decisionReason,
    emiAmount: result.emiAmount,
    loan: result.loan
  });
}

async function marketplace(req, res) {
  const loans = await listMarketplaceLoans();
  return res.json({ loans });
}

async function myLoans(req, res) {
  const loans = await getBorrowerLoans(req.user.id);
  return res.json({ loans });
}

async function pendingReviews(req, res) {
  const loans = await getPendingLoansForAdmin();
  return res.json({ loans });
}

async function reviewLoan(req, res) {
  const loan = await reviewLoanApplication(req.validated.params.loanId, req.user.id, req.validated.body);
  return res.json({
    message: "Loan review submitted successfully.",
    loan
  });
}

async function adminAnalytics(req, res) {
  const analytics = await getAdminAnalytics();
  return res.json({ analytics });
}

module.exports = {
  applyForLoan,
  marketplace,
  myLoans,
  pendingReviews,
  reviewLoan,
  adminAnalytics
};

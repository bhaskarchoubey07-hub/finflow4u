const {
  createLoanApplication,
  listMarketplaceLoans,
  getBorrowerLoans
} = require("../services/loanService");

async function applyForLoan(req, res) {
  const result = await createLoanApplication(req.user.id, req.validated.body);

  return res.status(201).json({
    message: "Loan application submitted successfully.",
    creditScore: result.evaluation.creditScore,
    riskGrade: result.evaluation.riskGrade,
    interestRate: result.evaluation.interestRate,
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

module.exports = {
  applyForLoan,
  marketplace,
  myLoans
};

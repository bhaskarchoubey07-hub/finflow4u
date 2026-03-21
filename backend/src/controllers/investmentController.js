const { investInLoan } = require("../services/investmentService");

async function createInvestment(req, res) {
  const investment = await investInLoan(req.user.id, req.validated.body);

  return res.status(201).json({
    message: "Investment placed successfully.",
    investment
  });
}

module.exports = {
  createInvestment
};

const { processRepayment } = require("../services/repaymentService");

async function payRepayment(req, res) {
  const result = await processRepayment({
    borrowerId: req.user.id,
    ...req.validated.body
  });

  return res.json({
    message: "Repayment processed successfully.",
    ...result
  });
}

module.exports = {
  payRepayment
};

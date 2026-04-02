const { getLenderPortfolio } = require("../services/investmentService");
const { getUserWalletSummary } = require("../services/walletService");

async function portfolio(req, res) {
  const data = await getLenderPortfolio(req.user.id);
  const wallet = await getUserWalletSummary(req.user.id, req.user.role);
  const payments = req.user.role === "LENDER" ? await require("../services/paymentService").getUserPayments(req.user.id) : [];
  return res.json({
    ...data,
    wallet,
    payments
  });
}

module.exports = {
  portfolio
};

const { getLenderPortfolio } = require("../services/investmentService");
const { getUserWalletSummary } = require("../services/walletService");

async function portfolio(req, res) {
  const data = await getLenderPortfolio(req.user.id);
  const wallet = await getUserWalletSummary(req.user.id, req.user.role);
  return res.json({
    ...data,
    wallet
  });
}

module.exports = {
  portfolio
};

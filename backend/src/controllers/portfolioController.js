const { getLenderPortfolio } = require("../services/investmentService");

async function portfolio(req, res) {
  const data = await getLenderPortfolio(req.user.id);
  return res.json(data);
}

module.exports = {
  portfolio
};

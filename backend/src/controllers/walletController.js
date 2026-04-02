const { getAdminLedgerOverview, createManualAdjustment } = require("../services/walletService");

async function adminLedger(req, res) {
  const data = await getAdminLedgerOverview();
  return res.json(data);
}

async function manualAdjustment(req, res) {
  const transfer = await createManualAdjustment({
    adminUserId: req.user.id,
    ...req.validated.body
  });

  return res.status(201).json({
    message: "Manual adjustment posted successfully.",
    transfer
  });
}

module.exports = {
  adminLedger,
  manualAdjustment
};

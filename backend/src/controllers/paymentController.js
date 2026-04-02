const { getUserWalletSummary } = require("../services/walletService");
const {
  createPaymentIntent,
  verifyRazorpayPayment,
  recordStripeWebhook,
  getUserPayments,
  getPaymentById,
  confirmStripeClientPayment
} = require("../services/paymentService");

async function createIntent(req, res) {
  const payment = await createPaymentIntent(req.user.id, req.validated.body);
  return res.status(201).json({
    message: "Payment intent created successfully.",
    payment,
    providerConfig:
      payment.provider === "RAZORPAY"
        ? {
            keyId: payment.metadata?.keyId || null
          }
        : null
  });
}

async function verifyRazorpay(req, res) {
  const payment = await verifyRazorpayPayment(req.validated.body);
  return res.json({
    message: "Razorpay payment verified successfully.",
    payment
  });
}

async function stripeWebhook(req, res) {
  const result = await recordStripeWebhook(req.body.toString("utf8"), req.headers["stripe-signature"]);
  return res.json(result);
}

async function wallet(req, res) {
  const summary = await getUserWalletSummary(req.user.id, req.user.role);
  const payments = await getUserPayments(req.user.id);

  return res.json({
    wallet: summary,
    payments
  });
}

async function paymentStatus(req, res) {
  const payment = await getPaymentById(req.user.id, req.validated.params.paymentId);
  return res.json({ payment });
}

async function confirmStripe(req, res) {
  const payment = await confirmStripeClientPayment(
    req.user.id,
    req.validated.body.paymentId,
    req.validated.body.providerPaymentId
  );

  return res.json({
    message: "Stripe payment confirmed successfully.",
    payment
  });
}

module.exports = {
  createIntent,
  verifyRazorpay,
  stripeWebhook,
  wallet,
  paymentStatus,
  confirmStripe
};

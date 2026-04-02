const crypto = require("crypto");
const { PaymentProvider } = require("@prisma/client");
const env = require("../config/env");

function getProviderConfig(provider) {
  if (provider === PaymentProvider.STRIPE) {
    if (!env.stripeSecretKey) {
      const error = new Error("Stripe is not configured.");
      error.statusCode = 400;
      throw error;
    }

    return {
      provider,
      secretKey: env.stripeSecretKey,
      publicKey: env.stripePublishableKey
    };
  }

  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    const error = new Error("Razorpay is not configured.");
    error.statusCode = 400;
    throw error;
  }

  return {
    provider,
    keyId: env.razorpayKeyId,
    keySecret: env.razorpayKeySecret
  };
}

function amountToMinorUnits(amount) {
  return Math.round(Number(amount) * 100);
}

async function createStripePaymentIntent({ amount, currency, metadata }) {
  const config = getProviderConfig(PaymentProvider.STRIPE);
  const body = new URLSearchParams({
    amount: String(amountToMinorUnits(amount)),
    currency: String(currency || "usd").toLowerCase(),
    "automatic_payment_methods[enabled]": "true"
  });

  Object.entries(metadata || {}).forEach(([key, value]) => {
    body.append(`metadata[${key}]`, String(value));
  });

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe payment intent creation failed.");
    error.statusCode = 400;
    throw error;
  }

  return {
    provider: PaymentProvider.STRIPE,
    providerPaymentId: data.id,
    providerOrderId: null,
    clientSecret: data.client_secret,
    metadata: data
  };
}

async function createRazorpayOrder({ amount, currency, receipt, notes }) {
  const config = getProviderConfig(PaymentProvider.RAZORPAY);
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: amountToMinorUnits(amount),
      currency: String(currency || "INR").toUpperCase(),
      receipt,
      notes
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.description || "Razorpay order creation failed.");
    error.statusCode = 400;
    throw error;
  }

  return {
    provider: PaymentProvider.RAZORPAY,
    providerPaymentId: null,
    providerOrderId: data.id,
    clientSecret: null,
    metadata: {
      ...data,
      keyId: config.keyId
    }
  };
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const config = getProviderConfig(PaymentProvider.RAZORPAY);
  const generated = crypto
    .createHmac("sha256", config.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generated === signature;
}

function verifyStripeWebhookSignature(rawBody, signature) {
  if (!env.stripeWebhookSecret) {
    const error = new Error("Stripe webhook secret is not configured.");
    error.statusCode = 400;
    throw error;
  }

  const signedPayload = signature?.split(",")?.find((part) => part.startsWith("v1="))?.split("=")?.[1];
  const timestamp = signature?.split(",")?.find((part) => part.startsWith("t="))?.split("=")?.[1];

  if (!signedPayload || !timestamp) {
    return false;
  }

  const computed = crypto
    .createHmac("sha256", env.stripeWebhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signedPayload));
}

module.exports = {
  createStripePaymentIntent,
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyStripeWebhookSignature
};

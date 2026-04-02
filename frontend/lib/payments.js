"use client";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

export async function launchRazorpayCheckout({
  keyId,
  orderId,
  amount,
  name,
  description,
  prefill,
  onSuccess
}) {
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");

  if (!window.Razorpay) {
    throw new Error("Razorpay SDK failed to load.");
  }

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      key: keyId,
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      name,
      description,
      order_id: orderId,
      prefill,
      handler: async (response) => {
        try {
          const result = await onSuccess(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Checkout cancelled"))
      }
    });

    razorpay.open();
  });
}

export async function loadStripeJs(publishableKey) {
  await loadScript("https://js.stripe.com/v3/");

  if (!window.Stripe) {
    throw new Error("Stripe SDK failed to load.");
  }

  return window.Stripe(publishableKey);
}

export async function pollPaymentStatus({ paymentId, token, apiRequest, attempts = 8, intervalMs = 2000 }) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await apiRequest(`/payments/${paymentId}`, { token });

    if (response.payment.status === "SUCCEEDED" || response.payment.status === "FAILED") {
      return response.payment;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

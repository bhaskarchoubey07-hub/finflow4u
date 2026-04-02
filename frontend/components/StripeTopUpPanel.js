"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { getToken } from "../lib/auth";
import { loadStripeJs, pollPaymentStatus } from "../lib/payments";

export default function StripeTopUpPanel({ onSuccess, onMessage }) {
  const mountRef = useRef(null);
  const paymentElementRef = useRef(null);
  const elementsRef = useRef(null);
  const stripeRef = useRef(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(1000);

  useEffect(() => {
    return () => {
      if (paymentElementRef.current?.destroy) {
        paymentElementRef.current.destroy();
      }
    };
  }, []);

  async function createIntent() {
    setLoading(true);

    try {
      const token = getToken();
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!stripeKey) {
        throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
      }

      const response = await apiRequest("/payments/intent", {
        method: "POST",
        token,
        body: {
          provider: "STRIPE",
          purpose: "LENDER_TOP_UP",
          amount: Number(amount),
          currency: "USD"
        }
      });

      const stripe = await loadStripeJs(stripeKey);
      stripeRef.current = stripe;
      setClientSecret(response.payment.clientSecret);
      setPaymentId(response.payment.id);

      if (paymentElementRef.current?.destroy) {
        paymentElementRef.current.destroy();
      }

      const elements = stripe.elements({ clientSecret: response.payment.clientSecret });
      const paymentElement = elements.create("payment");
      paymentElement.mount(mountRef.current);
      elementsRef.current = elements;
      paymentElementRef.current = paymentElement;

      onMessage?.("Stripe payment form is ready.");
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment() {
    if (!stripeRef.current || !clientSecret || !elementsRef.current) {
      onMessage?.("Create a payment intent first.");
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      const stripe = stripeRef.current;
      const result = await stripe.confirmPayment({
        clientSecret,
        elements: elementsRef.current,
        redirect: "if_required"
      });

      if (result.error) {
        throw new Error(result.error.message || "Stripe payment confirmation failed.");
      }

      if (result.paymentIntent?.id) {
        await apiRequest("/payments/stripe/confirm", {
          method: "POST",
          token,
          body: {
            paymentId,
            providerPaymentId: result.paymentIntent.id
          }
        });
      }

      const finalPayment =
        (await pollPaymentStatus({ paymentId, token, apiRequest })) || {
          status: "REQUIRES_ACTION"
        };

      if (finalPayment.status === "SUCCEEDED") {
        onMessage?.("Stripe payment succeeded and wallet balances are updating.");
        onSuccess?.();
        return;
      }

      if (finalPayment.status === "FAILED") {
        throw new Error("Stripe payment failed after confirmation.");
      }

      onMessage?.(`Stripe payment status: ${finalPayment.status}.`);
    } catch (error) {
      onMessage?.(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel nested-panel">
      <h3>Stripe Wallet Top-up</h3>
      <label>
        Top-up amount
        <input type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
      </label>
      <div className="payment-actions">
        <button className="ghost-button" onClick={createIntent} disabled={loading}>
          {loading ? "Preparing..." : "Create Stripe Intent"}
        </button>
        <button className="primary-button small" onClick={confirmPayment} disabled={loading || !clientSecret}>
          Confirm Payment
        </button>
      </div>
      <div ref={mountRef} className="stripe-mount" />
    </div>
  );
}

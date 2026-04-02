const {
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
  WalletType,
  LedgerAccountType,
  LedgerEntryDirection,
  NotificationChannel
} = require("@prisma/client");
const prisma = require("../config/prisma");
const {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyStripeWebhookSignature
} = require("./paymentGatewayService");
const { ensureWalletWithAccounts, postTransfer } = require("./ledgerService");
const { processRepayment } = require("./repaymentService");
const { notifyUser } = require("./notificationService");

async function createPaymentIntent(userId, payload) {
  const provider = payload.provider;
  const paymentRecord = await prisma.payment.create({
    data: {
      userId,
      loanId: payload.loanId || null,
      provider,
      purpose: payload.purpose,
      amount: Number(payload.amount),
      currency: payload.currency || (provider === PaymentProvider.RAZORPAY ? "INR" : "USD"),
      metadata: {
        ...payload.metadata,
        userId,
        purpose: payload.purpose
      }
    }
  });

  const gatewayPayload =
    provider === PaymentProvider.STRIPE
      ? await createStripePaymentIntent({
          amount: payload.amount,
          currency: paymentRecord.currency,
          metadata: {
            paymentId: paymentRecord.id,
            userId,
            purpose: payload.purpose,
            loanId: payload.loanId || ""
          }
        })
      : await createRazorpayOrder({
          amount: payload.amount,
          currency: paymentRecord.currency,
          receipt: paymentRecord.id,
          notes: {
            paymentId: paymentRecord.id,
            userId,
            purpose: payload.purpose,
            loanId: payload.loanId || ""
          }
        });

  return prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      providerPaymentId: gatewayPayload.providerPaymentId,
      providerOrderId: gatewayPayload.providerOrderId,
      clientSecret: gatewayPayload.clientSecret,
      metadata: gatewayPayload.metadata,
      status:
        provider === PaymentProvider.STRIPE ? PaymentStatus.REQUIRES_ACTION : PaymentStatus.PENDING
    }
  });
}

async function markPaymentSucceeded(paymentId, updates = {}) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.SUCCEEDED,
      providerPaymentId: updates.providerPaymentId,
      providerOrderId: updates.providerOrderId,
      metadata: updates.metadata
    }
  });
}

async function applyLenderTopUp(tx, payment) {
  const platformWallet = await ensureWalletWithAccounts(tx, {
    walletType: WalletType.PLATFORM
  });
  const lenderWallet = await ensureWalletWithAccounts(tx, {
    walletType: WalletType.LENDER,
    userId: payment.userId
  });

  const platformCash = platformWallet.accounts.find((account) => account.type === LedgerAccountType.CASH);
  const lenderCash = lenderWallet.accounts.find((account) => account.type === LedgerAccountType.CASH);

  const transfer = await postTransfer(tx, {
    description: "Lender wallet top-up received from gateway",
    amount: payment.amount,
    referenceType: "LENDER_TOP_UP",
    entries: [
      {
        walletId: platformWallet.id,
        ledgerAccountId: platformCash.id,
        amount: payment.amount,
        direction: LedgerEntryDirection.DEBIT,
        memo: "Platform cash received from gateway top-up"
      },
      {
        walletId: lenderWallet.id,
        ledgerAccountId: lenderCash.id,
        amount: payment.amount,
        direction: LedgerEntryDirection.DEBIT,
        memo: "Lender wallet credited from top-up"
      }
    ]
  });

  await tx.payment.update({
    where: { id: payment.id },
    data: {
      transferId: transfer.id
    }
  });

  await notifyUser(payment.userId, {
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    type: "wallet-top-up",
    subject: "Wallet top-up successful",
    message: `A top-up of $${Number(payment.amount).toFixed(2)} has been credited to your wallet.`
  });
}

async function applyBorrowerRepayment(payment) {
  await processRepayment({
    borrowerId: payment.userId,
    loanId: payment.loanId,
    amountPaid: Number(payment.amount)
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.SUCCEEDED
    }
  });
}

async function fulfillSuccessfulPayment(paymentId, updates = {}) {
  const existing = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!existing) {
    const error = new Error("Payment record not found.");
    error.statusCode = 404;
    throw error;
  }

  if (existing.status === PaymentStatus.SUCCEEDED) {
    return existing;
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SUCCEEDED,
        providerPaymentId: updates.providerPaymentId || existing.providerPaymentId,
        providerOrderId: updates.providerOrderId || existing.providerOrderId,
        metadata: updates.metadata || existing.metadata
      }
    });

    if (payment.purpose === PaymentPurpose.LENDER_TOP_UP) {
      await applyLenderTopUp(tx, payment);
    }
  });

  if (existing.purpose === PaymentPurpose.BORROWER_REPAYMENT) {
    await applyBorrowerRepayment({
      ...existing,
      providerPaymentId: updates.providerPaymentId || existing.providerPaymentId,
      providerOrderId: updates.providerOrderId || existing.providerOrderId
    });
  }

  return prisma.payment.findUnique({
    where: { id: paymentId }
  });
}

async function verifyRazorpayPayment(payload) {
  const verified = verifyRazorpaySignature({
    orderId: payload.orderId,
    paymentId: payload.paymentId,
    signature: payload.signature
  });

  if (!verified) {
    const error = new Error("Invalid Razorpay payment signature.");
    error.statusCode = 400;
    throw error;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: PaymentProvider.RAZORPAY,
      providerOrderId: payload.orderId
    }
  });

  if (!payment) {
    const error = new Error("Payment record not found for Razorpay order.");
    error.statusCode = 404;
    throw error;
  }

  return fulfillSuccessfulPayment(payment.id, {
    providerPaymentId: payload.paymentId,
    providerOrderId: payload.orderId,
    metadata: {
      ...(payment.metadata || {}),
      razorpayPaymentId: payload.paymentId,
      razorpaySignature: payload.signature
    }
  });
}

async function recordStripeWebhook(rawBody, signature) {
  const verified = verifyStripeWebhookSignature(rawBody, signature);

  if (!verified) {
    const error = new Error("Invalid Stripe webhook signature.");
    error.statusCode = 400;
    throw error;
  }

  const payload = JSON.parse(rawBody);

  await prisma.webhookEvent.create({
    data: {
      provider: PaymentProvider.STRIPE,
      eventType: payload.type,
      providerId: payload.id,
      payload,
      processedAt: new Date()
    }
  });

  if (payload.type === "payment_intent.succeeded") {
    const intent = payload.data.object;
    const paymentId = intent.metadata?.paymentId;

    if (paymentId) {
      await fulfillSuccessfulPayment(paymentId, {
        providerPaymentId: intent.id,
        metadata: intent
      });
    }
  }

  return { received: true };
}

async function getUserPayments(userId) {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      loan: {
        select: {
          id: true,
          purpose: true,
          riskGrade: true
        }
      }
    }
  });

  return payments.map((payment) => ({
    id: payment.id,
    provider: payment.provider,
    purpose: payment.purpose,
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
    createdAt: payment.createdAt,
    loan: payment.loan
  }));
}

async function getPaymentById(userId, paymentId) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId
    },
    include: {
      loan: {
        select: {
          id: true,
          purpose: true,
          riskGrade: true
        }
      }
    }
  });

  if (!payment) {
    const error = new Error("Payment not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: payment.id,
    provider: payment.provider,
    purpose: payment.purpose,
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
    providerPaymentId: payment.providerPaymentId,
    providerOrderId: payment.providerOrderId,
    clientSecret: payment.clientSecret,
    createdAt: payment.createdAt,
    loan: payment.loan
  };
}

async function confirmStripeClientPayment(userId, paymentId, providerPaymentId) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
      provider: PaymentProvider.STRIPE
    }
  });

  if (!payment) {
    const error = new Error("Stripe payment record not found.");
    error.statusCode = 404;
    throw error;
  }

  const paymentIntent = await retrieveStripePaymentIntent(providerPaymentId);

  if (paymentIntent.status !== "succeeded") {
    const error = new Error(`Stripe payment is currently ${paymentIntent.status}.`);
    error.statusCode = 400;
    throw error;
  }

  return fulfillSuccessfulPayment(payment.id, {
    providerPaymentId: paymentIntent.id,
    metadata: paymentIntent
  });
}

module.exports = {
  createPaymentIntent,
  verifyRazorpayPayment,
  recordStripeWebhook,
  getUserPayments,
  getPaymentById,
  confirmStripeClientPayment
};

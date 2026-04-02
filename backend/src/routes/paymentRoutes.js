const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const { createIntent, verifyRazorpay, stripeWebhook, wallet } = require("../controllers/paymentController");

const router = express.Router();

const createIntentSchema = z.object({
  body: z.object({
    provider: z.enum(["STRIPE", "RAZORPAY"]),
    purpose: z.enum(["LENDER_TOP_UP", "BORROWER_REPAYMENT"]),
    amount: z.coerce.number().positive(),
    currency: z.string().min(3).max(3).optional(),
    loanId: z.string().min(5).optional(),
    metadata: z.record(z.any()).optional()
  })
});

const verifyRazorpaySchema = z.object({
  body: z.object({
    orderId: z.string().min(5),
    paymentId: z.string().min(5),
    signature: z.string().min(10)
  })
});

router.post("/stripe/webhook", asyncHandler(stripeWebhook));
router.post(
  "/razorpay/verify",
  authenticate,
  validate(verifyRazorpaySchema),
  asyncHandler(verifyRazorpay)
);

router.get("/wallet", authenticate, authorize("BORROWER", "LENDER"), asyncHandler(wallet));
router.post(
  "/intent",
  authenticate,
  authorize("BORROWER", "LENDER"),
  validate(createIntentSchema),
  asyncHandler(createIntent)
);

module.exports = router;

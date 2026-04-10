const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const { analyzeBorrower } = require("../services/riskAnalysisService");
const { generateForensicScore } = require("../services/forensicService");

const router = express.Router();

/**
 * Advanced Risk Analyzer (Individual)
 * Endpoint for Screenshot 1 features
 */
router.post(
  "/advanced-risk",
  authenticate,
  asyncHandler(async (req, res) => {
    const analysis = analyzeBorrower(req.body);
    res.json(analysis);
  })
);

/**
 * Forensic Analysis (Batch/Institutional)
 * Endpoint for Screenshot 2 features
 */
router.post(
  "/forensics",
  authenticate,
  asyncHandler(async (req, res) => {
    // In a real app, this would handle a Multipart upload of a CSV.
    // Here we simulate the result of a batch scan.
    const result = generateForensicScore(req.body.data || []);
    res.json(result);
  })
);

module.exports = router;

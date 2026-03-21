const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const { portfolio } = require("../controllers/portfolioController");

const router = express.Router();

/**
 * @swagger
 * /portfolio:
 *   get:
 *     summary: Get the lender portfolio summary
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, authorize("LENDER"), asyncHandler(portfolio));

module.exports = router;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const env = require("./config/env");
const swaggerDocument = require("./docs/swagger");
const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");
const adminRoutes = require("./routes/adminRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const repaymentRoutes = require("./routes/repaymentRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (env.clientUrls.includes(origin)) {
    return true;
  }

  if (env.clientUrlPatterns.some((pattern) => pattern.test(origin))) {
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.protocol === "https:" && parsedOrigin.hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
}

app.use("/payments/stripe/webhook", express.raw({ type: "application/json" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("combined"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/auth", authRoutes);
app.use("/loan", loanRoutes);
app.use("/admin", adminRoutes);
app.use("/invest", investmentRoutes);
app.use("/payments", paymentRoutes);
app.use("/repayment", repaymentRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/analysis", analysisRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);

module.exports = app;

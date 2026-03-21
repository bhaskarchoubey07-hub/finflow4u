const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const env = require("./config/env");
const swaggerDocument = require("./docs/swagger");
const authRoutes = require("./routes/authRoutes");
const loanRoutes = require("./routes/loanRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const repaymentRoutes = require("./routes/repaymentRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const matchesExplicitOrigin = env.clientUrls.includes(origin);
      const matchesPattern = env.clientUrlPatterns.some((pattern) => pattern.test(origin || ""));

      if (!origin || matchesExplicitOrigin || matchesPattern) {
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
app.use("/invest", investmentRoutes);
app.use("/repayment", repaymentRoutes);
app.use("/portfolio", portfolioRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);

module.exports = app;

const dotenv = require("dotenv");

dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const clientOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  emailFrom: process.env.EMAIL_FROM || "alerts@lendgrid.local",
  smsFrom: process.env.SMS_FROM || "LENDGRID",
  clientUrls: clientOrigins.filter((origin) => !origin.includes("*")),
  clientUrlPatterns: clientOrigins
    .filter((origin) => origin.includes("*"))
    .map((pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("\\*", ".*")}$`))
};

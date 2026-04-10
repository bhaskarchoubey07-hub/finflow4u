const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { NotificationChannel } = require("@prisma/client");
const prisma = require("../config/prisma");
const env = require("../config/env");
const { notifyUser } = require("../services/notificationService");

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

async function register(req, res) {
  const { name, email, password, role } = req.validated.body;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role
    }
  });

  const token = signToken(user);

  await notifyUser(user.id, {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    type: "welcome",
    subject: "Welcome to LendGrid",
    message: `Hi ${user.name}, your ${user.role.toLowerCase()} account is now active.`
  });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      creditScore: user.creditScore
    }
  });
}

async function login(req, res) {
  const { email, password } = req.validated.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      creditScore: user.creditScore
    }
  });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

async function forgotPassword(req, res) {
  const { email } = req.validated.body;

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return res.json({ 
      message: "If that email is registered, a reset link has been sent.",
      _devOnlyError: "No user found with that email. Please enter a registered email to test." 
    });
  }

  const resetToken = jwt.sign({ userId: user.id, reset: true }, env.jwtSecret, { expiresIn: "15m" });
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  await notifyUser(user.id, {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    type: "password-reset",
    subject: "Password Reset Request",
    message: `You requested a password reset. Click here to reset your password: ${resetLink} . This link expires in 15 minutes.`
  });

  return res.json({ 
    message: "If that email is registered, a reset link has been sent.",
    _devOnlyResetLink: resetLink 
  });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.validated.body;
  console.log("[AuthService] Attempting password reset with token:", token ? (token.substring(0, 10) + "...") : "null");

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    console.log("[AuthService] Token verified successfully for userId:", decoded.userId);
    
    if (!decoded.reset || !decoded.userId) {
      console.warn("[AuthService] Token missing reset flag or userId.");
      return res.status(400).json({ message: "Invalid reset token structure." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash }
    });
    console.log("[AuthService] Password updated for user:", updatedUser.email);

    return res.json({ message: "Password has been successfully reset." });
  } catch (error) {
    console.error("[AuthService] Password reset failed:", error.name, error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Reset token has expired (15m limit)." });
    }
    return res.status(400).json({ message: "Invalid or corrupt reset token." });
  }
}

async function kycUpload(req, res) {
  const { docType, docUrl } = req.body;
  const userId = req.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: "VERIFYING",
      kycDocUrl: docUrl
    }
  });

  await notifyUser(userId, {
    channels: [NotificationChannel.IN_APP],
    type: "kyc-update",
    subject: "KYC Documents Received",
    message: `Your ${docType.replace("_", " ")} has been received and is under review.`
  });

  return res.json({ message: "Documents submitted for verification." });
}

async function updatePreferences(req, res) {
  const { autoRepay } = req.body;
  const userId = req.user.id;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { autoRepay }
  });

  return res.json({ 
    message: `Auto-repayment ${autoRepay ? "enabled" : "disabled"}.`,
    autoRepay: user.autoRepay 
  });
}

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  kycUpload,
  updatePreferences
};


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");

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

module.exports = {
  register,
  login,
  me
};

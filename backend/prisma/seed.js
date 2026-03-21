const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole, LoanStatus, RepaymentStatus } = require("@prisma/client");

const prisma = new PrismaClient();

function calculateEmi(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Number((principal / months).toFixed(2));
  }

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Number(emi.toFixed(2));
}

async function main() {
  await prisma.repayment.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const borrower = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "borrower@example.com",
      passwordHash,
      role: UserRole.BORROWER,
      creditScore: 728
    }
  });

  const lender = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "lender@example.com",
      passwordHash,
      role: UserRole.LENDER,
      creditScore: 790
    }
  });

  const interestRate = 11.5;
  const termMonths = 12;
  const amount = 15000;
  const emiAmount = calculateEmi(amount, interestRate, termMonths);

  const loan = await prisma.loanRequest.create({
    data: {
      borrowerId: borrower.id,
      amount,
      interestRate,
      riskGrade: "B",
      status: LoanStatus.ACTIVE,
      purpose: "Inventory purchase",
      termMonths,
      annualIncome: 32000,
      existingDebt: 3000,
      employmentStatus: "Self-employed",
      emiAmount
    }
  });

  await prisma.investment.create({
    data: {
      lenderId: lender.id,
      loanId: loan.id,
      amountInvested: 8000
    }
  });

  const today = new Date();

  await prisma.repayment.createMany({
    data: [
      {
        loanId: loan.id,
        amountPaid: emiAmount,
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 5),
        status: RepaymentStatus.PENDING
      },
      {
        loanId: loan.id,
        amountPaid: emiAmount,
        dueDate: new Date(today.getFullYear(), today.getMonth() + 2, 5),
        status: RepaymentStatus.PENDING
      }
    ]
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

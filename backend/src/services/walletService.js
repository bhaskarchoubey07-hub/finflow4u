const {
  WalletType,
  LedgerAccountType,
  LedgerEntryDirection,
  NotificationChannel
} = require("@prisma/client");
const prisma = require("../config/prisma");
const { ensureWalletWithAccounts, getWalletSnapshot, postTransfer } = require("./ledgerService");
const { notifyUser } = require("./notificationService");

async function getAdminLedgerOverview() {
  const [wallets, recentTransfers, overdueLoans, flaggedLoans, users] = await Promise.all([
    prisma.wallet.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        accounts: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.transfer.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        entries: true
      }
    }),
    prisma.repayment.count({
      where: {
        status: "OVERDUE"
      }
    }),
    prisma.loanRequest.findMany({
      where: {
        OR: [{ riskBand: "High" }, { riskBand: "Very High" }, { status: "DEFAULTED" }]
      },
      include: {
        borrower: {
          select: { id: true, name: true, email: true }
        }
      },
      take: 10,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        creditScore: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    wallets: wallets.map((wallet) => ({
      id: wallet.id,
      type: wallet.type,
      balance: Number(wallet.balance),
      user: wallet.user,
      accounts: wallet.accounts.map((account) => ({
        type: account.type,
        balance: Number(account.balance)
      }))
    })),
    recentTransfers: recentTransfers.map((transfer) => ({
      id: transfer.id,
      description: transfer.description,
      amount: Number(transfer.amount),
      referenceType: transfer.referenceType,
      createdAt: transfer.createdAt,
      entries: transfer.entries.map((entry) => ({
        amount: Number(entry.amount),
        direction: entry.direction,
        ledgerAccountId: entry.ledgerAccountId,
        memo: entry.memo
      }))
    })),
    overdueLoans,
    flaggedLoans: flaggedLoans.map((loan) => ({
      id: loan.id,
      amount: Number(loan.amount),
      riskBand: loan.riskBand,
      status: loan.status,
      borrower: loan.borrower,
      probabilityOfDefault: Number(loan.probabilityOfDefault || 0)
    })),
    users
  };
}

async function getUserWalletSummary(userId, role) {
  const walletType = role === "BORROWER" ? WalletType.BORROWER : WalletType.LENDER;
  await ensureWalletWithAccounts(prisma, { walletType, userId });
  const wallet = await getWalletSnapshot(prisma, { walletType, userId });

  return wallet
    ? {
        id: wallet.id,
        type: wallet.type,
        balance: Number(wallet.balance),
        accounts: wallet.accounts.map((account) => ({
          type: account.type,
          balance: Number(account.balance)
        }))
      }
    : null;
}

async function createManualAdjustment({ adminUserId, userId, role, amount, reason }) {
  const numericAmount = Number(amount);

  return prisma.$transaction(async (tx) => {
    const platformWallet = await ensureWalletWithAccounts(tx, {
      walletType: WalletType.PLATFORM
    });
    const targetWallet = await ensureWalletWithAccounts(tx, {
      walletType: role === "BORROWER" ? WalletType.BORROWER : WalletType.LENDER,
      userId
    });

    const platformReserve = platformWallet.accounts.find((account) => account.type === LedgerAccountType.RESERVE);
    const targetAccount = targetWallet.accounts.find((account) =>
      role === "BORROWER"
        ? account.type === LedgerAccountType.BORROWER_PAYABLE
        : account.type === LedgerAccountType.LENDER_PAYABLE
    );

    const transfer = await postTransfer(tx, {
      description: `Manual admin adjustment: ${reason}`,
      amount: numericAmount,
      referenceType: "ADMIN_ADJUSTMENT",
      entries: [
        {
          walletId: platformWallet.id,
          ledgerAccountId: platformReserve.id,
          amount: numericAmount,
          direction: LedgerEntryDirection.CREDIT,
          memo: `Admin ${adminUserId} adjustment reserve movement`
        },
        {
          walletId: targetWallet.id,
          ledgerAccountId: targetAccount.id,
          amount: numericAmount,
          direction: LedgerEntryDirection.DEBIT,
          memo: reason
        }
      ]
    });

    await notifyUser(userId, {
      channels: [NotificationChannel.IN_APP],
      type: "manual-adjustment",
      subject: "Account adjustment posted",
      message: `An admin adjustment of $${numericAmount.toFixed(2)} was posted: ${reason}`
    });

    return transfer;
  });
}

module.exports = {
  getAdminLedgerOverview,
  getUserWalletSummary,
  createManualAdjustment
};

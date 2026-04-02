const {
  WalletType,
  LedgerAccountType,
  LedgerEntryDirection,
  TransferStatus
} = require("@prisma/client");

const PLATFORM_WALLET_KEY = "platform";

const DEFAULT_ACCOUNTS = {
  [WalletType.PLATFORM]: [
    LedgerAccountType.CASH,
    LedgerAccountType.FUNDING_HOLD,
    LedgerAccountType.INTEREST_REVENUE,
    LedgerAccountType.FEE_REVENUE,
    LedgerAccountType.RESERVE
  ],
  [WalletType.BORROWER]: [LedgerAccountType.BORROWER_PAYABLE, LedgerAccountType.LOAN_RECEIVABLE],
  [WalletType.LENDER]: [LedgerAccountType.CASH, LedgerAccountType.FUNDING_HOLD, LedgerAccountType.LENDER_PAYABLE]
};

async function ensureWalletWithAccounts(tx, { walletType, userId = null, currency = "USD" }) {
  let wallet;

  if (walletType === WalletType.PLATFORM) {
    wallet = await tx.wallet.findFirst({
      where: {
        type: WalletType.PLATFORM,
        userId: null
      },
      include: { accounts: true }
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          type: WalletType.PLATFORM,
          currency
        },
        include: { accounts: true }
      });
    }
  } else {
    wallet = await tx.wallet.findUnique({
      where: {
        userId_type: {
          userId,
          type: walletType
        }
      },
      include: { accounts: true }
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          type: walletType,
          currency
        },
        include: { accounts: true }
      });
    }
  }

  const requiredAccounts = DEFAULT_ACCOUNTS[walletType] || [];

  for (const accountType of requiredAccounts) {
    if (!wallet.accounts.find((account) => account.type === accountType)) {
      const createdAccount = await tx.ledgerAccount.create({
        data: {
          walletId: wallet.id,
          type: accountType
        }
      });

      wallet.accounts.push(createdAccount);
    }
  }

  return wallet;
}

function signedAmount(direction, amount) {
  return direction === LedgerEntryDirection.DEBIT ? Number(amount) : -Number(amount);
}

async function postTransfer(tx, { description, amount, referenceType, loanId, investmentId, repaymentId, entries }) {
  const transfer = await tx.transfer.create({
    data: {
      description,
      amount: Number(amount),
      referenceType,
      loanId,
      investmentId,
      repaymentId,
      status: TransferStatus.POSTED
    }
  });

  for (const entry of entries) {
    await tx.ledgerEntry.create({
      data: {
        transferId: transfer.id,
        ledgerAccountId: entry.ledgerAccountId,
        amount: Number(entry.amount),
        direction: entry.direction,
        memo: entry.memo
      }
    });

    await tx.ledgerAccount.update({
      where: { id: entry.ledgerAccountId },
      data: {
        balance: {
          increment: signedAmount(entry.direction, entry.amount)
        }
      }
    });
  }

  const impactedWalletIds = [...new Set(entries.map((entry) => entry.walletId).filter(Boolean))];

  for (const walletId of impactedWalletIds) {
    const walletAccounts = await tx.ledgerAccount.findMany({
      where: { walletId }
    });

    const walletBalance = walletAccounts.reduce((sum, account) => sum + Number(account.balance), 0);

    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: walletBalance }
    });
  }

  return transfer;
}

async function getWalletSnapshot(tx, { walletType, userId = null }) {
  const wallet =
    walletType === WalletType.PLATFORM
      ? await tx.wallet.findFirst({
          where: { type: WalletType.PLATFORM, userId: null },
          include: { accounts: true }
        })
      : await tx.wallet.findUnique({
          where: {
            userId_type: {
              userId,
              type: walletType
            }
          },
          include: { accounts: true }
        });

  return wallet;
}

module.exports = {
  PLATFORM_WALLET_KEY,
  ensureWalletWithAccounts,
  getWalletSnapshot,
  postTransfer
};

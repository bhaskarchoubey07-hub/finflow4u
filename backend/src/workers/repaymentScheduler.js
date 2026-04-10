const cron = require("node-cron");
const prisma = require("../config/prisma");
const { RepaymentStatus, LoanStatus, NotificationChannel } = require("@prisma/client");
const { notifyUser } = require("../services/notificationService");

/**
 * Repayment Scheduler
 * Runs every day at midnight (00:00)
 */
function startRepaymentScheduler() {
  console.log("Starting Repayment Scheduler...");

  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily repayment check...");
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Process Due Repayments
      const dueRepayments = await prisma.repayment.findMany({
        where: {
          status: RepaymentStatus.PENDING,
          dueDate: {
            lte: today
          }
        },
        include: {
          loan: {
            include: {
              borrower: true
            }
          }
        }
      });

      console.log(`Found ${dueRepayments.length} due repayments.`);

      for (const repayment of dueRepayments) {
        const borrower = repayment.loan.borrower;
        
        // 1.1 Try Automated Deduction if enabled
        if (borrower.autoRepay) {
           try {
             const wallet = await prisma.wallet.findUnique({
               where: { userId_type: { userId: borrower.id, type: WalletType.BORROWER } }
             });

             if (wallet && Number(wallet.balance) >= Number(repayment.amountPaid)) {
                // Execute auto-deduction logic
                const { processRepayment } = require("../services/repaymentService");
                await processRepayment({
                  borrowerId: borrower.id,
                  loanId: repayment.loanId,
                  amountPaid: Number(repayment.amountPaid)
                });
                
                console.log(`Auto-deducted EMI for loan ${repayment.loanId} borrower ${borrower.id}`);
                continue; // Skip overdue logic for this repayment
             }
           } catch (autoErr) {
             console.error("Auto-deduction failed:", autoErr);
           }
        }

        // 1.2 Mark as OVERDUE if the date has passed


      // 2. Identify Potential Defaults (e.g., 30 days overdue)
      const defaultCheckDate = new Date();
      defaultCheckDate.setDate(defaultCheckDate.getDate() - 30);

      const riskyLoans = await prisma.loanRequest.findMany({
        where: {
          status: LoanStatus.ACTIVE,
          repayments: {
            some: {
              status: RepaymentStatus.OVERDUE,
              dueDate: {
                lte: defaultCheckDate
              }
            }
          }
        }
      });

      for (const loan of riskyLoans) {
        await prisma.loanRequest.update({
          where: { id: loan.id },
          data: { status: LoanStatus.DEFAULTED }
        });
        
        console.log(`Loan ${loan.id} marked as DEFAULTED.`);
      }

    } catch (error) {
      console.error("Error in repayment scheduler:", error);
    }
  });
}

module.exports = {
  startRepaymentScheduler
};

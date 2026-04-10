const app = require("./app");
const env = require("./config/env");
const { startRepaymentScheduler } = require("./workers/repaymentScheduler");

app.listen(env.port, () => {
  console.log(`API server running on port ${env.port}`);
  
  // Initialize background workers
  startRepaymentScheduler();
});


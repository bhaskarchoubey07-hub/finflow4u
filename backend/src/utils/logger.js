function logTransaction(message, payload = {}) {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      payload,
      timestamp: new Date().toISOString()
    })
  );
}

module.exports = {
  logTransaction
};

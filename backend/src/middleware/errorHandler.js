function errorHandler(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    message,
    details: error.details || undefined
  });
}

module.exports = errorHandler;

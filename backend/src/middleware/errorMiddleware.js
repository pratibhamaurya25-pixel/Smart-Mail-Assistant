function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "An unexpected error occurred";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid value provided";
  } else if (statusCode === 500) {
    console.error(error);
    message = "An unexpected server error occurred";
  }

  res.status(statusCode).json({ message });
}

export { notFound, errorHandler };

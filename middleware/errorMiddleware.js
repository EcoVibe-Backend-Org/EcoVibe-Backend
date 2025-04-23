// middleware/errorMiddleware.js

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  // Customizing the response for different error types
  const statusCode = err.status || 500; // Default to 500 if no specific status is provided
  res.status(statusCode).json({
    message: err.message || "Something went wrong",
  });
};

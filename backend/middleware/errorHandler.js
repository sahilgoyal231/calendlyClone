function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  console.error(err.stack);

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A record with this data already exists.'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong.'
  });
}

export default errorHandler;

const successResponse = (
  res,
  data = {},
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const validationErrorResponse = (res, errors) => {
  return errorResponse(
    res,
    "Validation failed",
    400,
    errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }))
  );
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
};

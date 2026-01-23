const { validationResult } = require("express-validator");
const { validationErrorResponse } = require("../utils/responseHandler");

// Validation middleware wrapper
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Return validation errors
    return validationErrorResponse(res, errors);
  };
};

module.exports = {
  validate,
};

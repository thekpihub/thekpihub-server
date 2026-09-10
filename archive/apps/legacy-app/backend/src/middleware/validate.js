const { validationResult } = require('express-validator');
const response = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.error(
      res,
      'Validation failed',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg, value: e.value }))
    );
  }
  next();
};

module.exports = validate;

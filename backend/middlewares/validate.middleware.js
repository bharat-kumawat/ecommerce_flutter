import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const fieldErrors = {};

    for (const error of result.array({ onlyFirstError: true })) {
      const field = error.path || error.param || "request";
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(error.msg);
    }

    throw ApiError.badRequest("Validation failed", fieldErrors);
  }

  next();
};

export default validate;

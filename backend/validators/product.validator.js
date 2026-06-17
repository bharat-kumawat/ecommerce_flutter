import { body } from "express-validator";

const isValidArrayObject = (items, fieldName) => {
  if (!Array.isArray(items)) throw new Error(`${fieldName} must be an array`);
  if (items.length > 100) throw new Error(`${fieldName} has too many items`);
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${fieldName} items must be objects`);
    }
  }
  return true;
};

const optionalProductValidator = [
  body("comparePrice")
    .optional()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage("Compare price must be between 0.01 and 10000000")
    .bail()
    .custom((value, { req }) => {
      if (req.body.price !== undefined && Number(value) < Number(req.body.price)) {
        throw new Error("Compare price cannot be less than product price");
      }
      return true;
    }),
  body("brand")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Brand cannot exceed 100 characters"),
  body("stock")
    .optional()
    .isInt({ min: 0, max: 999999 })
    .withMessage("Stock must be between 0 and 999999")
    .toInt(),
  body("flashSalePrice")
    .optional()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage("Flash sale price must be between 0.01 and 10000000")
    .bail()
    .custom((value, { req }) => {
      if (req.body.price !== undefined && Number(value) >= Number(req.body.price)) {
        throw new Error("Flash sale price must be less than product price");
      }
      return true;
    }),
  body("flashSaleEndTime")
    .optional()
    .isISO8601()
    .withMessage("Flash sale end time must be a valid ISO date")
    .bail()
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("Flash sale end time must be in the future");
      }
      return true;
    }),
  body("isFeatured").optional().isBoolean().withMessage("isFeatured must be a boolean").toBoolean(),
  body("isFlashSale").optional().isBoolean().withMessage("isFlashSale must be a boolean").toBoolean(),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean").toBoolean(),
  body("images").optional().isArray({ max: 5 }).withMessage("Maximum 5 images are allowed"),
  body("variants").optional().custom((value) => isValidArrayObject(value, "Variants")),
  body("specifications").optional().custom((value) => isValidArrayObject(value, "Specifications")),
];

export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .bail()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .bail()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage("Price must be between 0.01 and 10000000"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .bail()
    .isMongoId()
    .withMessage("Valid category ID is required"),
  ...optionalProductValidator,
  body("isFlashSale").custom((value, { req }) => {
    const isFlashSale = value === true || value === "true";
    if (isFlashSale && !req.body.flashSaleEndTime) {
      throw new Error("Flash sale end time is required when flash sale is enabled");
    }
    if (isFlashSale && req.body.flashSalePrice === undefined) {
      throw new Error("Flash sale price is required when flash sale is enabled");
    }
    return true;
  }),
];

export const updateProductValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .bail()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0.01, max: 10000000 })
    .withMessage("Price must be between 0.01 and 10000000"),
  body("category").optional().isMongoId().withMessage("Valid category ID is required"),
  ...optionalProductValidator,
];

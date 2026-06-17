import { body } from "express-validator";

export const addToCartValidator = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid product ID"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .bail()
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999")
    .toInt(),
  body("variant")
    .optional()
    .isObject()
    .withMessage("Variant must be an object"),
  body("variant.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant name cannot be empty")
    .bail()
    .isLength({ max: 60 })
    .withMessage("Variant name cannot exceed 60 characters"),
  body("variant.value")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Variant value cannot be empty")
    .bail()
    .isLength({ max: 80 })
    .withMessage("Variant value cannot exceed 80 characters"),
];

export const updateCartItemValidator = [
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .bail()
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be between 1 and 999")
    .toInt(),
];

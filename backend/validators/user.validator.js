import { body } from "express-validator";

const phonePattern = /^[0-9+\-\s()]{6,20}$/;
const postalCodePattern = /^[A-Za-z0-9\-\s]{3,20}$/;

export const addAddressValidator = [
  body("label")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Label cannot exceed 50 characters"),
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .matches(phonePattern)
    .withMessage("Invalid phone number format"),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .bail()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("postalCode")
    .optional()
    .trim()
    .matches(postalCodePattern)
    .withMessage("Invalid postal code format"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean")
    .toBoolean(),
];

export const updateAddressValidator = [
  body("label")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Label cannot exceed 50 characters"),
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone cannot be empty")
    .bail()
    .matches(phonePattern)
    .withMessage("Invalid phone number format"),
  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty")
    .bail()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),
  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("postalCode")
    .optional()
    .trim()
    .matches(postalCodePattern)
    .withMessage("Invalid postal code format"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean")
    .toBoolean(),
];

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(phonePattern)
    .withMessage("Invalid phone number format"),
];

export const saveCardValidator = [
  body("cardNumber").trim().notEmpty().withMessage("Card number is required"),
  body("cardholderName")
    .trim()
    .notEmpty()
    .withMessage("Cardholder name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Cardholder name must be between 2 and 100 characters"),
  body("expiry").trim().notEmpty().withMessage("Expiry is required"),
  body("cvv").trim().notEmpty().withMessage("CVV is required"),
  body("cardType")
    .optional()
    .isIn(["visa", "mastercard", "amex", "discover"])
    .withMessage("Invalid card type"),
];

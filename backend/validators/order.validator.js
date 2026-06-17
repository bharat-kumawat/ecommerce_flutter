import { body } from "express-validator";

const phonePattern = /^[0-9+\-\s()]{6,20}$/;
const postalCodePattern = /^[A-Za-z0-9\-\s]{3,20}$/;

export const createOrderValidator = [
  body("shippingAddress").isObject().withMessage("Shipping address is required"),
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .bail()
    .matches(phonePattern)
    .withMessage("Invalid phone number format"),
  body("shippingAddress.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .bail()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("shippingAddress.postalCode")
    .optional()
    .trim()
    .matches(postalCodePattern)
    .withMessage("Invalid postal code format"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .bail()
    .isIn(["card", "cod"])
    .withMessage("Invalid payment method"),
  body("paymentResult")
    .optional()
    .isObject()
    .withMessage("Payment result must be an object"),
  body("paymentResult.status")
    .optional()
    .isIn(["success", "failed", "pending"])
    .withMessage("Invalid payment status"),
  body("paymentResult.id")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Payment ID cannot exceed 100 characters"),
];

export const cardPaymentValidator = [
  body("cardNumber").trim().notEmpty().withMessage("Card number is required"),
  body("expiry").trim().notEmpty().withMessage("Expiry is required"),
  body("cvv").trim().notEmpty().withMessage("CVV is required"),
  body("cardholderName").trim().notEmpty().withMessage("Cardholder name is required"),
];

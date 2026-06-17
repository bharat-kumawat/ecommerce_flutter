import { body } from "express-validator";

export const updateUserRoleValidator = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isIn(["user", "admin"])
    .withMessage("Role must be 'user' or 'admin'"),
];

export const updateOrderStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .bail()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("trackingNumber")
    .optional()
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage("Tracking number must be between 3 and 80 characters"),
];

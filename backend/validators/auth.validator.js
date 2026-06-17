import { body } from "express-validator";

const nameRule = body("name")
  .trim()
  .notEmpty()
  .withMessage("Name is required")
  .bail()
  .isLength({ min: 2, max: 50 })
  .withMessage("Name must be between 2 and 50 characters")
  .bail()
  .matches(/^[A-Za-z][A-Za-z0-9 .'-]*$/)
  .withMessage("Name can contain only letters, numbers, spaces, dots, apostrophes and hyphens");

const emailRule = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .bail()
  .isLength({ max: 254 })
  .withMessage("Email cannot exceed 254 characters")
  .bail()
  .isEmail()
  .withMessage("Valid email required")
  .bail()
  .normalizeEmail();

const passwordRule = (field, label = "Password") =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage(`${label} must be between 8 and 128 characters`)
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage(`${label} must include uppercase, lowercase and number`);

export const registerValidator = [
  nameRule,
  emailRule,
  passwordRule("password"),
];

export const loginValidator = [
  emailRule,
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidator = [emailRule];

export const resetPasswordValidator = [passwordRule("password")];

export const updatePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  passwordRule("newPassword", "New password"),
];

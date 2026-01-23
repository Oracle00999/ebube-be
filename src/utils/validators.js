const { body } = require("express-validator");
const { User } = require("../models");

// User registration validation
// User registration validation
const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Please provide a valid phone number"),

  // Add country validation
  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),
];

// User login validation
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

// Update profile validation
const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Please provide a valid phone number"),
];

// Change password validation
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password cannot be same as current password");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// Deposit/Withdrawal validation
const transactionValidation = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be at least 0.01"),

  body("cryptocurrency")
    .isIn([
      "bitcoin",
      "ethereum",
      "tether",
      "binance-coin",
      "solana",
      "ripple",
      "stellar",
      "dogecoin",
      "tron",
    ])
    .withMessage("Invalid cryptocurrency"),

  body("toAddress")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Destination address is required for withdrawals"),
];

// Deposit validation
const depositValidation = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be at least 0.01"),

  body("cryptocurrency")
    .isIn([
      "bitcoin",
      "ethereum",
      "tether",
      "binance-coin",
      "solana",
      "ripple",
      "stellar",
      "dogecoin",
      "tron",
    ])
    .withMessage("Invalid cryptocurrency"),

  body("txHash")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Transaction hash cannot be empty if provided"),
];

// Withdrawal validation (address required)
const withdrawalValidation = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be at least 0.01"),

  body("cryptocurrency")
    .isIn([
      "bitcoin",
      "ethereum",
      "tether",
      "binance-coin",
      "solana",
      "ripple",
      "stellar",
      "dogecoin",
      "tron",
    ])
    .withMessage("Invalid cryptocurrency"),

  body("toAddress")
    .trim()
    .notEmpty()
    .withMessage("Destination address is required"),
];

// User registration validation (with phone and country required)
const userRegisterValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  // Phone required for users
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required for user registration")
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Please provide a valid phone number"),

  // Country required for users
  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required for user registration")
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),
];

// Admin registration validation (phone and country optional)
const adminRegisterValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email, role: "admin" });
      if (existingUser) {
        throw new Error("Admin with this email already exists");
      }
      return true;
    }),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  // Phone optional for admin
  body("phone")
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage("Please provide a valid phone number"),

  // Country optional for admin
  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  transactionValidation,
  depositValidation,
  withdrawalValidation,
  userRegisterValidation,
  adminRegisterValidation,
};

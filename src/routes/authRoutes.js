const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const {
  registerValidation,
  userRegisterValidation,
  adminRegisterValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require("../utils/validators");
const resetController = require("../controllers/resetController");

// Public routes
router.post(
  "/register",
  validate(userRegisterValidation),
  authController.register
);
router.post(
  "/register-admin",
  validate(adminRegisterValidation),
  authController.registerAdmin
);
router.post("/login", validate(loginValidation), authController.login);
// router.post('/login', validate(loginValidation), authController.login);

// Password reset routes (public)
router.post("/forgot-password", resetController.requestPasswordReset);
router.post("/reset-password", resetController.resetPassword);
router.post("/validate-reset-code", resetController.validateResetCode);

// Protected routes
router.get("/me", protect, authController.getMe);
router.put(
  "/me",
  protect,
  validate(updateProfileValidation),
  authController.updateProfile
);
router.put(
  "/change-password",
  protect,
  validate(changePasswordValidation),
  authController.changePassword
);
router.post("/logout", protect, authController.logout);

module.exports = router;

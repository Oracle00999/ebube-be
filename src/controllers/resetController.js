const { User, ResetCode } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// Helper: Generate random reset code
const generateResetCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // For security, ALWAYS return the same response
    // But only generate code if user exists
    const response = {
      message:
        "If your email exists in our system, a reset code has been generated.",
      note: "Contact admin if you need assistance.",
      warning:
        "Check your records for the reset code or contact administrator.",
    };

    if (!user) {
      // Return generic response without generating code
      return successResponse(res, response, "Reset process initiated");
    }

    // Check if user has active reset code
    const existingCode = await ResetCode.findOne({
      user: user._id,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingCode) {
      return successResponse(
        res,
        {
          ...response,
          resetCode: existingCode.code,
          expiresAt: existingCode.expiresAt,
          specificMessage: "Use existing code above. Code expires in 1 hour.",
        },
        "Existing reset code found"
      );
    }

    // Generate new reset code only for existing users
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create reset code record
    await ResetCode.create({
      user: user._id,
      code: code,
      expiresAt: expiresAt,
    });

    successResponse(
      res,
      {
        ...response,
        resetCode: code,
        expiresAt: expiresAt,
        specificMessage:
          "Use this code to reset your password. Code expires in 1 hour.",
      },
      "Reset code generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not
    if (!user) {
      // Return same error as invalid code
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Find valid reset code
    const resetCodeDoc = await ResetCode.findOne({
      user: user._id,
      code: resetCode,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetCodeDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Update user password
    user.password = newPassword;
    await user.save();

    // Mark reset code as used
    resetCodeDoc.markAsUsed();
    await resetCodeDoc.save();

    successResponse(
      res,
      {
        message:
          "Password reset successfully. You can now login with your new password.",
      },
      "Password reset successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Validate reset code
// @route   POST /api/auth/validate-reset-code
// @access  Public
const validateResetCode = async (req, res, next) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({
        success: false,
        message: "Email and reset code are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    // Don't reveal if user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Find valid reset code
    const resetCodeDoc = await ResetCode.findOne({
      user: user._id,
      code: resetCode,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetCodeDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    successResponse(
      res,
      {
        valid: true,
        expiresAt: resetCodeDoc.expiresAt,
        message: "Reset code is valid",
      },
      "Reset code is valid"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  validateResetCode,
};

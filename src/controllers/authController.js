const jwt = require("jsonwebtoken");
const { User, Wallet } = require("../models");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const { BadRequestError, UnauthorizedError } = require("../utils/errorHandler");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      country,
    });

    // Create wallet for user
    const wallet = await Wallet.create({
      user: user._id,
    });

    // Update user with wallet reference
    user.wallet = wallet._id;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    successResponse(
      res,
      {
        user,
        wallet,
        token,
      },
      "Registration successful",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      throw new BadRequestError("Please provide email and password");
    }

    // Get user with password
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password matches
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    successResponse(
      res,
      {
        user,
        token,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("wallet", "balances totalValue")
      .select("-password");

    successResponse(res, { user }, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;

    // Fields that can be updated
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone !== undefined) updateFields.phone = phone;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    successResponse(res, { user }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    successResponse(res, { token }, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    successResponse(res, {}, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Register admin user
// @route   POST /api/auth/register-admin
// @access  Public (for development - should be protected in production)
const registerAdmin = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;

    // Check if admin already exists with this email
    const existingAdmin = await User.findOne({ email, role: "admin" });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Create admin user
    const admin = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      country,
      role: "admin",
    });

    // Create wallet for admin
    const wallet = await Wallet.create({
      user: admin._id,
    });

    // Update admin with wallet reference
    admin.wallet = wallet._id;
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    // Remove password from response
    admin.password = undefined;

    successResponse(
      res,
      {
        user: admin,
        wallet,
        token,
      },
      "Admin registration successful",
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  registerAdmin,
};

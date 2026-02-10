const { User, Wallet } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Get user profile by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("wallet")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(res, { user }, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search = "" } = req.query;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { country: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get all users (no pagination)
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .populate("wallet", "totalValue");

    const total = users.length;

    successResponse(
      res,
      {
        users,
        total,
      },
      "Users retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(
      res,
      { user },
      `User ${isActive ? "activated" : "deactivated"} successfully`,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wallet details
// @route   GET /api/users/:id/wallet
// @access  Private/Admin
const getUserWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    successResponse(res, { wallet }, "Wallet retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend user account
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    // Cannot suspend yourself
    if (userId === adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend your own account",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
      },
      `User ${user.email} suspended`,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user account
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
const activateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    successResponse(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        },
      },
      `User ${user.email} activated`,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all suspended users
// @route   GET /api/admin/users/suspended
// @access  Private/Admin
const getSuspendedUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build search query for suspended users
    const searchQuery = {
      isActive: false,
      role: "user", // Only regular users, not admins
      ...(search && {
        $or: [
          { email: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      }),
    };

    // Get suspended users with pagination
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(searchQuery);

    // Format response (simple)
    const formattedUsers = users.map((user) => ({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      kycStatus: user.kycStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }));

    successResponse(
      res,
      {
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      },
      "Suspended users retrieved",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUserStatus,
  getUserWallet,
  suspendUser,
  activateUser,
  getSuspendedUsers,
};

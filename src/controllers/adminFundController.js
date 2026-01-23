const { User, Wallet } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Fund user account
// @route   POST /api/admin/users/:userId/fund
// @access  Private/Admin
const fundUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cryptocurrency, amount } = req.body;
    const adminId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Validate cryptocurrency
    const validCryptos = [
      "bitcoin",
      "ethereum",
      "tether",
      "binance-coin",
      "solana",
      "ripple",
      "stellar",
      "dogecoin",
      "tron",
    ];

    if (!cryptocurrency || !validCryptos.includes(cryptocurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cryptocurrency",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    // Get current balance
    const currentBalance = wallet.getBalance(cryptocurrency);

    // Update balance
    const newBalance = wallet.updateBalance(cryptocurrency, amount);
    await wallet.save();

    successResponse(
      res,
      {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        funding: {
          cryptocurrency: cryptocurrency,
          amount: amount,
          previousBalance: currentBalance,
          newBalance: newBalance,
          totalValue: wallet.totalValue,
        },
        message: `Successfully funded ${user.firstName}'s ${cryptocurrency} account with $${amount}`,
      },
      "User account funded successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fundUserAccount,
};

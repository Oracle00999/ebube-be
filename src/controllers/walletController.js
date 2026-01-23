const { Wallet, Transaction, CryptoAddress } = require("../models");
const { successResponse } = require("../utils/responseHandler");
const { notifyAdmins } = require("../utils/emailService");

// @desc    Get user wallet balances
// @route   GET /api/wallet/balance
// @access  Private
const getWalletBalances = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const balances = wallet.getAllBalances();

    successResponse(
      res,
      {
        walletId: wallet._id,
        totalValue: wallet.totalValue,
        balances: balances,
        lastActivity: wallet.lastActivity,
      },
      "Wallet balances retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific cryptocurrency balance
// @route   GET /api/wallet/balance/:cryptocurrency
// @access  Private
const getCryptoBalance = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const balance = wallet.getBalance(cryptocurrency);
    const symbol = wallet.getCryptoSymbol(cryptocurrency);

    successResponse(
      res,
      {
        cryptocurrency: cryptocurrency,
        symbol: symbol,
        balance: balance,
        walletId: wallet._id,
      },
      "Balance retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Request a deposit
// @route   POST /api/wallet/deposit/request
// @access  Private
const requestDeposit = async (req, res, next) => {
  try {
    const { amount, cryptocurrency, txHash } = req.body;
    const userId = req.user.id;

    // Check if deposit address exists for this cryptocurrency
    const depositAddress = await CryptoAddress.findOne({
      cryptocurrency: cryptocurrency,
      isActive: true,
    });

    if (!depositAddress) {
      return res.status(400).json({
        success: false,
        message: `Deposit address not configured for ${cryptocurrency}. Please contact admin.`,
      });
    }

    // Create deposit transaction
    const transaction = await Transaction.create({
      user: userId,
      type: "deposit",
      cryptocurrency: cryptocurrency,
      amount: amount,
      txHash: txHash || null,
      status: "pending",
      metadata: {
        requestedBy: userId,
        requestedAt: new Date(),
        depositAddress: depositAddress.address,
      },
    });

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        depositAddress: depositAddress.address,
        message:
          "Deposit request submitted. Send funds to the address above and await admin confirmation.",
      },
      "Deposit request submitted",
      201,
    );

    // Send admin notification after response (fire-and-forget)
    notifyAdmins("depositRequest", {
      user: req.user,
      transaction: transaction.getUserDetails(),
    }).catch((emailError) => {
      console.error("Failed to send deposit notification:", emailError);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a withdrawal
// @route   POST /api/wallet/withdraw/request
// @access  Private
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, cryptocurrency, toAddress } = req.body;
    const userId = req.user.id;

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const currentBalance = wallet.getBalance(cryptocurrency);

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${cryptocurrency} balance`,
      });
    }

    // DEDUCT BALANCE IMMEDIATELY
    const newBalance = wallet.updateBalance(cryptocurrency, -amount);
    await wallet.save();

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: userId,
      type: "withdrawal",
      cryptocurrency: cryptocurrency,
      amount: amount,
      toAddress: toAddress,
      status: "pending",
      metadata: {
        requestedBy: userId,
        requestedAt: new Date(),
        originalBalance: currentBalance, // Store original balance
        newBalance: newBalance, // Store new balance after deduction
      },
    });

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        newBalance: newBalance,
        message:
          "Withdrawal request submitted. Balance deducted. Awaiting admin approval.",
      },
      "Withdrawal request submitted",
      201,
    );

    // Send admin notification after response (fire-and-forget)
    notifyAdmins("withdrawalRequest", {
      user: req.user,
      transaction: transaction.getUserDetails(),
    }).catch((emailError) => {
      console.error("Failed to send withdrawal notification:", emailError);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user transaction history
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactionHistory = async (req, res, next) => {
  try {
    const { type, cryptocurrency, status, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (cryptocurrency) filter.cryptocurrency = cryptocurrency;
    if (status) filter.status = status;

    // Get transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-metadata -adminNotes -processedBy -__v");

    // Get total count
    const total = await Transaction.countDocuments(filter);

    // Format transactions for user view
    const formattedTransactions = transactions.map((tx) => tx.getUserDetails());

    successResponse(
      res,
      {
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      },
      "Transaction history retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction by ID
// @route   GET /api/wallet/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
      },
      "Transaction retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWalletBalances,
  getCryptoBalance,
  requestDeposit,
  requestWithdrawal,
  getTransactionHistory,
  getTransactionById,
};

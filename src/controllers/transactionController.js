const { Transaction, Wallet } = require("../models");
const { successResponse } = require("../utils/responseHandler");
const { notifyAdmins } = require("../utils/emailService");

// @desc    Confirm a deposit
// @route   PUT /api/admin/transactions/deposits/:id/confirm
// @access  Private/Admin
const confirmDeposit = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const adminId = req.user.id;
    // const { notes } = req.body;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "firstName lastName email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.type !== "deposit") {
      return res.status(400).json({
        success: false,
        message: "Only deposit transactions can be confirmed",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already ${transaction.status}`,
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: transaction.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    // Update wallet balance
    wallet.updateBalance(transaction.cryptocurrency, transaction.amount);
    await wallet.save();

    // Notify admins about confirmed deposit
    try {
      await notifyAdmins("depositConfirmed", {
        user: transaction.user,
        transaction: transaction.getUserDetails(),
      });
    } catch (emailError) {
      console.error("Failed to send deposit confirmation email:", emailError);
    }

    // Mark transaction as completed
    transaction.markAsCompleted(adminId);
    await transaction.save();

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        user: {
          name: `${transaction.user.firstName} ${transaction.user.lastName}`,
          email: transaction.user.email,
        },
        newBalance: wallet.getBalance(transaction.cryptocurrency),
        totalValue: wallet.totalValue,
        message: "Deposit confirmed successfully",
      },
      "Deposit confirmed successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a deposit
// @route   PUT /api/admin/transactions/deposits/:id/reject
// @access  Private/Admin
const rejectDeposit = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const adminId = req.user.id;
    // const { notes } = req.body;

    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "firstName lastName email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.type !== "deposit") {
      return res.status(400).json({
        success: false,
        message: "Only deposit transactions can be rejected",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already ${transaction.status}`,
      });
    }

    // Mark transaction as failed
    transaction.markAsFailed(adminId);
    await transaction.save();

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        user: {
          name: `${transaction.user.firstName} ${transaction.user.lastName}`,
          email: transaction.user.email,
        },
        message: "Deposit rejected successfully",
      },
      "Deposit rejected successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a withdrawal
// @route   PUT /api/admin/transactions/withdrawals/:id/approve
// @access  Private/Admin
const approveWithdrawal = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const adminId = req.user.id;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "firstName lastName email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.type !== "withdrawal") {
      return res.status(400).json({
        success: false,
        message: "Only withdrawal transactions can be approved",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already ${transaction.status}`,
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: transaction.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    // Check current balance (should already be deducted)
    const currentBalance = wallet.getBalance(transaction.cryptocurrency);

    // Verify user still has sufficient balance (in case of multiple pending withdrawals)
    if (currentBalance < 0) {
      return res.status(400).json({
        success: false,
        message: `User has insufficient ${transaction.cryptocurrency} balance`,
      });
    }

    // Mark transaction as completed (balance already deducted)
    transaction.markAsCompleted(adminId);
    await transaction.save();

    // Notify admins about processed withdrawal
    try {
      await notifyAdmins("withdrawalProcessed", {
        user: transaction.user,
        transaction: transaction.getUserDetails(),
      });
    } catch (emailError) {
      console.error("Failed to send withdrawal processed email:", emailError);
    }

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        user: {
          name: `${transaction.user.firstName} ${transaction.user.lastName}`,
          email: transaction.user.email,
        },
        withdrawalDetails: {
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          cryptocurrency: transaction.cryptocurrency,
        },
        currentBalance: currentBalance,
        totalValue: wallet.totalValue,
        message:
          "Withdrawal approved successfully. Funds sent to destination address.",
      },
      "Withdrawal approved successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a withdrawal
// @route   PUT /api/admin/transactions/withdrawals/:id/reject
// @access  Private/Admin
const rejectWithdrawal = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const adminId = req.user.id;

    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "firstName lastName email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.type !== "withdrawal") {
      return res.status(400).json({
        success: false,
        message: "Only withdrawal transactions can be rejected",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already ${transaction.status}`,
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: transaction.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    // ADD BACK THE DEDUCTED BALANCE
    const refundedBalance = wallet.updateBalance(
      transaction.cryptocurrency,
      transaction.amount,
    );
    await wallet.save();

    // Mark transaction as failed
    transaction.markAsFailed(adminId);
    await transaction.save();

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        user: {
          name: `${transaction.user.firstName} ${transaction.user.lastName}`,
          email: transaction.user.email,
        },
        refundDetails: {
          amount: transaction.amount,
          cryptocurrency: transaction.cryptocurrency,
          newBalance: refundedBalance,
        },
        message: "Withdrawal rejected. Balance refunded to user.",
      },
      "Withdrawal rejected successfully",
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a transaction (user or admin)
// @route   PUT /api/admin/transactions/:id/cancel
// @access  Private/Admin
const cancelTransaction = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const adminId = req.user.id;

    const transaction = await Transaction.findById(transactionId).populate(
      "user",
      "firstName lastName email",
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel transaction that is ${transaction.status}`,
      });
    }

    // If it's a withdrawal, add back the balance
    if (transaction.type === "withdrawal") {
      const wallet = await Wallet.findOne({ user: transaction.user._id });
      if (wallet) {
        wallet.updateBalance(transaction.cryptocurrency, transaction.amount);
        await wallet.save();
      }
    }

    // Update transaction status
    transaction.status = "cancelled";
    transaction.processedBy = adminId;
    transaction.processedAt = new Date();

    await transaction.save();

    successResponse(
      res,
      {
        transaction: transaction.getUserDetails(),
        message:
          transaction.type === "withdrawal"
            ? "Transaction cancelled. Balance refunded to user."
            : "Transaction cancelled successfully.",
      },
      "Transaction cancelled successfully",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
  cancelTransaction,
};

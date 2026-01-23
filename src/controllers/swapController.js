const { Swap, Wallet, Transaction } = require("../models");
const { successResponse } = require("../utils/responseHandler");
const { CRYPTO_TYPES } = require("../config/constants");

// @desc    Execute instant swap
// @route   POST /api/swap/execute
// @access  Private
const executeSwap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fromCrypto, toCrypto, amount } = req.body;

    // Validate input
    if (!fromCrypto || !toCrypto || !amount) {
      return res.status(400).json({
        success: false,
        message: "fromCrypto, toCrypto, and amount are required",
      });
    }

    // Check if swapping same cryptocurrency
    if (fromCrypto === toCrypto) {
      return res.status(400).json({
        success: false,
        message: "Cannot swap the same cryptocurrency",
      });
    }

    // Validate cryptocurrency types
    const validCryptos = Object.values(CRYPTO_TYPES);
    if (
      !validCryptos.includes(fromCrypto) ||
      !validCryptos.includes(toCrypto)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cryptocurrency type",
      });
    }

    // Check amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Check if user has sufficient balance
    const fromBalance = wallet.getBalance(fromCrypto);

    if (fromBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${fromCrypto} balance`,
      });
    }

    // Store balances before swap for record
    const balancesBefore = {
      [fromCrypto]: fromBalance,
      [toCrypto]: wallet.getBalance(toCrypto),
      total: wallet.totalValue,
    };

    // Execute swap (1:1 USD value)
    // Deduct from source
    const newFromBalance = wallet.updateBalance(fromCrypto, -amount);

    // Add to destination (same USD amount)
    const newToBalance = wallet.updateBalance(toCrypto, amount);

    // Save wallet
    await wallet.save();

    // Store balances after swap
    const balancesAfter = {
      [fromCrypto]: newFromBalance,
      [toCrypto]: newToBalance,
      total: wallet.totalValue,
    };

    // Create swap record
    const swap = await Swap.create({
      user: userId,
      fromCrypto: fromCrypto,
      toCrypto: toCrypto,
      amount: amount,
      amountReceived: amount, // 1:1 USD value
      rate: 1, // Always 1 for USD value swap
      status: "completed",
      balancesBefore: balancesBefore,
      balancesAfter: balancesAfter,
      fee: 0, // No fees as per requirements
      metadata: {
        executedAt: new Date(),
        swapType: "instant",
      },
    });

    // Also create a transaction record for history
    await Transaction.create({
      user: userId,
      type: "swap",
      cryptocurrency: fromCrypto, // Primary crypto involved
      amount: amount,
      status: "completed",
      metadata: {
        swapId: swap._id,
        fromCrypto: fromCrypto,
        toCrypto: toCrypto,
        amountReceived: amount,
        rate: 1,
      },
    });

    successResponse(
      res,
      {
        swap: swap.getDetails(),
        wallet: {
          newBalances: {
            [fromCrypto]: newFromBalance,
            [toCrypto]: newToBalance,
          },
          totalValue: wallet.totalValue,
        },
        message: "Swap executed successfully",
      },
      "Swap executed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get swap history
// @route   GET /api/swap/history
// @access  Private
const getSwapHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fromCrypto, toCrypto, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: userId };
    if (fromCrypto) filter.fromCrypto = fromCrypto;
    if (toCrypto) filter.toCrypto = toCrypto;

    // Get swaps
    const swaps = await Swap.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Swap.countDocuments(filter);

    // Format swaps
    const formattedSwaps = swaps.map((swap) => swap.getDetails());

    successResponse(
      res,
      {
        swaps: formattedSwaps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
      },
      "Swap history retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific swap details
// @route   GET /api/swap/:id
// @access  Private
const getSwapDetails = async (req, res, next) => {
  try {
    const swapId = req.params.id;
    const userId = req.user.id;

    // Try to find by MongoDB _id
    let swap = await Swap.findOne({
      _id: swapId,
      user: userId,
    });

    // If not found by _id, try to find by swapId virtual field
    // We need to find all and filter by virtual field
    if (!swap) {
      const allUserSwaps = await Swap.find({ user: userId });
      swap = allUserSwaps.find((s) => s.swapId === swapId);
    }

    if (!swap) {
      return res.status(404).json({
        success: false,
        message: "Swap not found",
      });
    }

    successResponse(
      res,
      {
        swap: swap.getDetails(),
      },
      "Swap details retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get swap statistics
// @route   GET /api/swap/statistics
// @access  Private
const getSwapStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get total swaps count
    const totalSwaps = await Swap.countDocuments({ user: userId });

    // Get total volume (sum of all swap amounts)
    const totalVolumeResult = await Swap.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
    ]);

    const totalVolume =
      totalVolumeResult.length > 0 ? totalVolumeResult[0].totalVolume : 0;

    // Get most swapped from cryptocurrency
    const mostSwappedFrom = await Swap.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$fromCrypto",
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    // Get most swapped to cryptocurrency
    const mostSwappedTo = await Swap.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$toCrypto",
          count: { $sum: 1 },
          volume: { $sum: "$amount" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    // Get recent swaps
    const recentSwaps = await Swap.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fromCrypto toCrypto amount createdAt");

    successResponse(
      res,
      {
        statistics: {
          totalSwaps: totalSwaps,
          totalVolume: totalVolume,
          mostSwappedFrom:
            mostSwappedFrom.length > 0 ? mostSwappedFrom[0] : null,
          mostSwappedTo: mostSwappedTo.length > 0 ? mostSwappedTo[0] : null,
        },
        recentSwaps: recentSwaps.map((swap) => ({
          fromCrypto: swap.fromCrypto,
          toCrypto: swap.toCrypto,
          amount: swap.amount,
          date: swap.createdAt,
        })),
      },
      "Swap statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  executeSwap,
  getSwapHistory,
  getSwapDetails,
  getSwapStatistics,
};

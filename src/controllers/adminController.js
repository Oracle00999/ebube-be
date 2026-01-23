const { CryptoAddress, User, Transaction } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Add or update cryptocurrency deposit address
// @route   POST /api/admin/crypto-addresses
// @access  Private/Admin
const addOrUpdateCryptoAddress = async (req, res, next) => {
  try {
    const { cryptocurrency, address, network, notes } = req.body;
    const adminId = req.user.id;

    // Check if cryptocurrency is valid
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

    if (!validCryptos.includes(cryptocurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cryptocurrency",
      });
    }

    // Check if address already exists for this cryptocurrency
    const existingAddress = await CryptoAddress.findOne({ cryptocurrency });

    let cryptoAddress;

    if (existingAddress) {
      // Update existing address
      existingAddress.address = address;
      if (network !== undefined) existingAddress.network = network;
      existingAddress.addedBy = adminId;
      existingAddress.isActive = true;

      cryptoAddress = await existingAddress.save();
    } else {
      // Create new address
      cryptoAddress = await CryptoAddress.create({
        cryptocurrency,
        address,
        network,
        addedBy: adminId,
        isActive: true,
      });
    }

    successResponse(
      res,
      {
        cryptoAddress: cryptoAddress.getDisplayInfo(),
      },
      "Cryptocurrency address saved successfully"
    );
  } catch (error) {
    next(error);
  }
};
// @desc    Get all cryptocurrency addresses
// @route   GET /api/admin/crypto-addresses
// @access  Private/Admin
const getAllCryptoAddresses = async (req, res, next) => {
  try {
    const cryptoAddresses = await CryptoAddress.find()
      .sort({ cryptocurrency: 1 })
      .populate("addedBy", "firstName lastName email");

    const formattedAddresses = cryptoAddresses.map((address) => ({
      ...address.getDisplayInfo(),
      addedBy: address.addedBy
        ? {
            name: `${address.addedBy.firstName} ${address.addedBy.lastName}`,
            email: address.addedBy.email,
          }
        : null,
      updatedAt: address.updatedAt,
    }));

    successResponse(
      res,
      {
        cryptoAddresses: formattedAddresses,
      },
      "Cryptocurrency addresses retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific cryptocurrency address
// @route   GET /api/admin/crypto-addresses/:cryptocurrency
// @access  Private/Admin
const getCryptoAddress = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;

    const cryptoAddress = await CryptoAddress.findOne({
      cryptocurrency,
    }).populate("addedBy", "firstName lastName email");

    if (!cryptoAddress) {
      return res.status(404).json({
        success: false,
        message: "Cryptocurrency address not found",
      });
    }

    successResponse(
      res,
      {
        cryptoAddress: {
          ...cryptoAddress.getDisplayInfo(),
          addedBy: cryptoAddress.addedBy
            ? {
                name: `${cryptoAddress.addedBy.firstName} ${cryptoAddress.addedBy.lastName}`,
                email: cryptoAddress.addedBy.email,
              }
            : null,
          updatedAt: cryptoAddress.updatedAt,
        },
      },
      "Cryptocurrency address retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle cryptocurrency address status (active/inactive)
// @route   PUT /api/admin/crypto-addresses/:cryptocurrency/toggle-status
// @access  Private/Admin
const toggleCryptoAddressStatus = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;

    const cryptoAddress = await CryptoAddress.findOne({ cryptocurrency });

    if (!cryptoAddress) {
      return res.status(404).json({
        success: false,
        message: "Cryptocurrency address not found",
      });
    }

    cryptoAddress.isActive = !cryptoAddress.isActive;
    cryptoAddress.addedBy = req.user.id; // Update who made the change

    await cryptoAddress.save();

    successResponse(
      res,
      {
        cryptoAddress: cryptoAddress.getDisplayInfo(),
      },
      `Cryptocurrency address ${
        cryptoAddress.isActive ? "activated" : "deactivated"
      } successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending deposits
// @route   GET /api/admin/transactions/deposits/pending
// @access  Private/Admin
const getPendingDeposits = async (req, res, next) => {
  try {
    const deposits = await Transaction.find({
      type: "deposit",
      status: "pending",
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const formattedDeposits = deposits.map((deposit) => ({
      id: deposit._id,
      transactionId: deposit.transactionId,
      user: deposit.user
        ? {
            name: `${deposit.user.firstName} ${deposit.user.lastName}`,
            email: deposit.user.email,
          }
        : null,
      cryptocurrency: deposit.cryptocurrency,
      amount: deposit.amount,
      status: deposit.status,
      requestedAt: deposit.createdAt,
      // metadata: deposit.metadata,
    }));

    successResponse(
      res,
      {
        deposits: formattedDeposits,
        count: formattedDeposits.length,
      },
      "Pending deposits retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending withdrawals
// @route   GET /api/admin/transactions/withdrawals/pending
// @access  Private/Admin
const getPendingWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Transaction.find({
      type: "withdrawal",
      status: "pending",
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal._id,
      transactionId: withdrawal.transactionId,
      user: withdrawal.user
        ? {
            name: `${withdrawal.user.firstName} ${withdrawal.user.lastName}`,
            email: withdrawal.user.email,
          }
        : null,
      cryptocurrency: withdrawal.cryptocurrency,
      amount: withdrawal.amount,
      toAddress: withdrawal.toAddress,
      status: withdrawal.status,
      requestedAt: withdrawal.createdAt,
      // metadata: withdrawal.metadata,
    }));

    successResponse(
      res,
      {
        withdrawals: formattedWithdrawals,
        count: formattedWithdrawals.length,
      },
      "Pending withdrawals retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrUpdateCryptoAddress,
  getAllCryptoAddresses,
  getCryptoAddress,
  toggleCryptoAddressStatus,
  getPendingDeposits,
  getPendingWithdrawals,
};

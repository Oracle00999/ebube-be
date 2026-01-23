const { CryptoAddress } = require("../models");
const { successResponse } = require("../utils/responseHandler");

// @desc    Get all deposit addresses
// @route   GET /api/wallet/deposit/addresses
// @access  Private
const getAllDepositAddresses = async (req, res, next) => {
  try {
    const cryptoAddresses = await CryptoAddress.find({ isActive: true }).sort({
      cryptocurrency: 1,
    });

    const addresses = cryptoAddresses.map((address) => ({
      cryptocurrency: address.cryptocurrency,
      symbol: address.symbol,
      address: address.address,
      network: address.network,
    }));

    successResponse(
      res,
      {
        addresses: addresses,
      },
      "Deposit addresses retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get deposit address for specific cryptocurrency
// @route   GET /api/wallet/deposit/address/:cryptocurrency
// @access  Private
const getDepositAddress = async (req, res, next) => {
  try {
    const { cryptocurrency } = req.params;

    const cryptoAddress = await CryptoAddress.findOne({
      cryptocurrency: cryptocurrency,
      isActive: true,
    });

    if (!cryptoAddress) {
      return res.status(404).json({
        success: false,
        message: "Deposit address not found for this cryptocurrency",
      });
    }

    successResponse(
      res,
      {
        address: cryptoAddress.getDisplayInfo(),
      },
      "Deposit address retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepositAddresses,
  getDepositAddress,
};

const mongoose = require("mongoose");
const { CRYPTO_TYPES, CRYPTO_SYMBOLS } = require("../config/constants");

const cryptoAddressSchema = new mongoose.Schema(
  {
    // Cryptocurrency type
    cryptocurrency: {
      type: String,
      enum: Object.values(CRYPTO_TYPES),
      required: true,
      unique: true,
    },

    // Deposit address (shown to all users)
    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Network type (for cryptocurrencies with multiple networks)
    network: {
      type: String,
      trim: true,
    },

    // Current status (active/inactive)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Admin who added/updated this address
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notes (optional)
    // notes: {
    //   type: String,
    //   trim: true,
    // },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
cryptoAddressSchema.index({ cryptocurrency: 1, isActive: 1 });

// Virtual for crypto symbol
cryptoAddressSchema.virtual("symbol").get(function () {
  return (
    CRYPTO_SYMBOLS[this.cryptocurrency] || this.cryptocurrency.toUpperCase()
  );
});

// Method to get display info for users
cryptoAddressSchema.methods.getDisplayInfo = function () {
  return {
    cryptocurrency: this.cryptocurrency,
    symbol: this.symbol,
    address: this.address,
    network: this.network,
    isActive: this.isActive,
  };
};

const CryptoAddress = mongoose.model("CryptoAddress", cryptoAddressSchema);

module.exports = CryptoAddress;

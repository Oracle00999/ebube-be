const mongoose = require("mongoose");
const { CRYPTO_TYPES } = require("../config/constants");

const swapSchema = new mongoose.Schema(
  {
    // User who initiated the swap
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Source cryptocurrency (what they're swapping from)
    fromCrypto: {
      type: String,
      enum: Object.values(CRYPTO_TYPES),
      required: true,
    },

    // Destination cryptocurrency (what they're swapping to)
    toCrypto: {
      type: String,
      enum: Object.values(CRYPTO_TYPES),
      required: true,
    },
    // Amount to swap (in USD value)
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be at least 0.01"],
    },

    // Rate used for swap (always 1:1 for USD value as per requirements)
    rate: {
      type: Number,
      default: 1,
    },

    // Amount received after swap (same as amount for 1:1 USD value)
    amountReceived: {
      type: Number,
      required: true,
    },

    // Status (always completed instantly as per requirements)
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },

    // Wallet balances before swap (for record keeping)
    balancesBefore: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Wallet balances after swap (for record keeping)
    balancesAfter: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Fee (if any, currently 0 as per requirements)
    fee: {
      type: Number,
      default: 0,
    },

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
swapSchema.index({ user: 1, createdAt: -1 });
swapSchema.index({ fromCrypto: 1, toCrypto: 1 });
swapSchema.index({ createdAt: -1 });

// Virtual for swap ID
swapSchema.virtual("swapId").get(function () {
  return `SW${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for checking if swap is valid (not swapping same currency)
swapSchema.virtual("isValidSwap").get(function () {
  return this.fromCrypto !== this.toCrypto;
});

// Pre-save validation
swapSchema.pre("save", function () {
  // Ensure we're not swapping the same cryptocurrency
  if (this.fromCrypto === this.toCrypto) {
    throw new Error("Cannot swap the same cryptocurrency");
  }

  // Set amountReceived to same as amount for 1:1 USD value swap
  if (this.isNew) {
    this.amountReceived = this.amount;
  }
});

// Method to get swap details
swapSchema.methods.getDetails = function () {
  return {
    swapId: this.swapId,
    fromCrypto: this.fromCrypto,
    toCrypto: this.toCrypto,
    amount: this.amount,
    amountReceived: this.amountReceived,
    rate: this.rate,
    fee: this.fee,
    status: this.status,
    createdAt: this.createdAt,
  };
};

// Ensure virtuals are included when converting to JSON
swapSchema.set("toJSON", { virtuals: true });
swapSchema.set("toObject", { virtuals: true });

const Swap = mongoose.model("Swap", swapSchema);

module.exports = Swap;

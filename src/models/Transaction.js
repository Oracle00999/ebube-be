const mongoose = require("mongoose");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  CRYPTO_TYPES,
} = require("../config/constants");

const transactionSchema = new mongoose.Schema(
  {
    // User who initiated the transaction
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Transaction type
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },

    // Cryptocurrency involved
    cryptocurrency: {
      type: String,
      enum: Object.values(CRYPTO_TYPES),
      required: true,
    },

    // Amount in USD
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be at least 0.01"],
    },

    // Status of transaction
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
    },

    // For deposits: transaction hash/ID from blockchain
    txHash: {
      type: String,
      trim: true,
    },

    // For withdrawals: destination address
    toAddress: {
      type: String,
      trim: true,
    },

    // For deposits: transaction hash/ID from blockchain
    txHash: {
      type: String,
      trim: true,
    },

    // Admin who processed the transaction
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Timestamps for different stages
    processedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Notes (for admin use)
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ cryptocurrency: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for readable transaction ID
transactionSchema.virtual("transactionId").get(function () {
  return `TX${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to check if transaction is pending
transactionSchema.methods.isPending = function () {
  return this.status === TRANSACTION_STATUS.PENDING;
};

// Method to check if transaction is completed
transactionSchema.methods.isCompleted = function () {
  return this.status === TRANSACTION_STATUS.COMPLETED;
};

// Method to mark as completed
transactionSchema.methods.markAsCompleted = function (adminId) {
  this.status = TRANSACTION_STATUS.COMPLETED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.completedAt = new Date();
  // if (notes) this.adminNotes = notes;
};

// Method to mark as failed
transactionSchema.methods.markAsFailed = function (adminId) {
  this.status = TRANSACTION_STATUS.FAILED;
  this.processedBy = adminId;
  this.processedAt = new Date();
  // if (notes) this.adminNotes = notes;
};

// Method to get transaction details for user display
transactionSchema.methods.getUserDetails = function () {
  return {
    id: this._id,
    transactionId: this.transactionId,
    type: this.type,
    cryptocurrency: this.cryptocurrency,
    amount: this.amount,
    status: this.status,
    createdAt: this.createdAt,
    completedAt: this.completedAt,
  };
};

// Ensure virtuals are included when converting to JSON
transactionSchema.set("toJSON", { virtuals: true });
transactionSchema.set("toObject", { virtuals: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;

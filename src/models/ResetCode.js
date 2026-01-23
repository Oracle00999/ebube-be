const mongoose = require("mongoose");

const resetCodeSchema = new mongoose.Schema(
  {
    // User who requested reset
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reset code (displayed to user) - unique: true creates index
    code: {
      type: String,
      required: true,
      unique: true, // This automatically creates { code: 1 } index
    },

    // Expiration time (1 hour)
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },

    // Whether code has been used
    used: {
      type: Boolean,
      default: false,
    },

    // When code was used
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired codes
resetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Keep only necessary indexes (remove duplicate { code: 1 } since unique: true creates it)
resetCodeSchema.index({ user: 1, used: 1 });

// Method to check if code is valid
resetCodeSchema.methods.isValid = function () {
  return !this.used && this.expiresAt > new Date();
};

// Method to mark as used
resetCodeSchema.methods.markAsUsed = function () {
  this.used = true;
  this.usedAt = new Date();
};

const ResetCode = mongoose.model("ResetCode", resetCodeSchema);

module.exports = ResetCode;

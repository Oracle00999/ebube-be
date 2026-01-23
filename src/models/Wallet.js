const mongoose = require("mongoose");
const {
  CRYPTO_TYPES,
  DEFAULT_BALANCES,
  CRYPTO_SYMBOLS,
} = require("../config/constants");

const walletSchema = new mongoose.Schema(
  {
    // Reference to user (one-to-one relationship)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Balances for different cryptocurrencies (in USD value)
    balances: {
      bitcoin: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.BTC],
        min: [0, "Balance cannot be negative"],
      },
      ethereum: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.ETH],
        min: [0, "Balance cannot be negative"],
      },
      tether: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.USDT],
        min: [0, "Balance cannot be negative"],
      },
      "binance-coin": {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.BNB],
        min: [0, "Balance cannot be negative"],
      },
      solana: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.SOL],
        min: [0, "Balance cannot be negative"],
      },
      ripple: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.XRP],
        min: [0, "Balance cannot be negative"],
      },
      stellar: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.XLM],
        min: [0, "Balance cannot be negative"],
      },
      dogecoin: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.DOGE],
        min: [0, "Balance cannot be negative"],
      },
      tron: {
        type: Number,
        default: DEFAULT_BALANCES[CRYPTO_TYPES.TRX],
        min: [0, "Balance cannot be negative"],
      },
    },

    // Total portfolio value (calculated virtual)
    totalValue: {
      type: Number,
      default: 0,
      min: [0, "Total value cannot be negative"],
    },

    // Wallet status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last activity timestamp
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total value before saving
walletSchema.pre("save", function () {
  // Only calculate if balances were modified or it's a new document
  if (this.isModified("balances") || this.isNew) {
    const balances = this.balances;
    this.totalValue = Object.values(balances).reduce((sum, balance) => {
      return sum + (Number(balance) || 0);
    }, 0);
  }
  this.lastActivity = new Date();
});

// Method to get balance for a specific crypto
walletSchema.methods.getBalance = function (cryptoType) {
  const normalizedType = cryptoType.toLowerCase().replace(" ", "-");
  return this.balances[normalizedType] || 0;
};

// Method to update balance
walletSchema.methods.updateBalance = function (cryptoType, amount) {
  const normalizedType = cryptoType.toLowerCase().replace(" ", "-");

  if (this.balances[normalizedType] === undefined) {
    throw new Error(`Unsupported cryptocurrency: ${cryptoType}`);
  }

  const newBalance = this.balances[normalizedType] + amount;

  if (newBalance < 0) {
    throw new Error(`Insufficient ${cryptoType} balance`);
  }

  this.balances[normalizedType] = newBalance;
  this.lastActivity = new Date();
  return newBalance;
};

// Method to get all balances as array
walletSchema.methods.getAllBalances = function () {
  return Object.entries(this.balances).map(([crypto, balance]) => ({
    cryptocurrency: crypto,
    balance: balance,
    symbol: this.getCryptoSymbol(crypto),
  }));
};

// Helper method to get crypto symbol
walletSchema.methods.getCryptoSymbol = function (cryptoType) {
  return CRYPTO_SYMBOLS[cryptoType] || cryptoType.toUpperCase();
};

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;

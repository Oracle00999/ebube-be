module.exports = {
  // User roles
  USER_ROLES: {
    USER: "user",
    ADMIN: "admin",
  },

  // Cryptocurrency types (must match model enum values)
  CRYPTO_TYPES: {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tether",
    BNB: "binance-coin",
    SOL: "solana",
    XRP: "ripple",
    XLM: "stellar",
    DOGE: "dogecoin",
    TRX: "tron",
  },

  // Transaction types
  TRANSACTION_TYPES: {
    DEPOSIT: "deposit",
    WITHDRAWAL: "withdrawal",
    SWAP: "swap",
  },

  // Transaction statuses
  TRANSACTION_STATUS: {
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
  },

  // KYC statuses
  KYC_STATUS: {
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
    NOT_SUBMITTED: "not_submitted",
  },

  // KYC document types
  KYC_DOC_TYPES: {
    NATIONAL_ID: "national_id",
    PASSPORT: "passport",
    DRIVER_LICENSE: "driver_license",
    VOTER_CARD: "voter_card",
  },

  // Default wallet balances (in USD)
  DEFAULT_BALANCES: {
    bitcoin: 0,
    ethereum: 0,
    tether: 0,
    "binance-coin": 0,
    solana: 0,
    ripple: 0,
    stellar: 0,
    dogecoin: 0,
    tron: 0,
  },

  // Crypto symbols mapping
  CRYPTO_SYMBOLS: {
    bitcoin: "BTC",
    ethereum: "ETH",
    tether: "USDT",
    "binance-coin": "BNB",
    solana: "SOL",
    ripple: "XRP",
    stellar: "XLM",
    dogecoin: "DOGE",
    tron: "TRX",
  },

  // Swap statuses
  SWAP_STATUS: {
    COMPLETED: "completed",
    FAILED: "failed",
  },

  // Response messages
  MESSAGES: {
    SUCCESS: "Operation successful",
    ERROR: "An error occurred",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    VALIDATION_ERROR: "Validation failed",
  },
};

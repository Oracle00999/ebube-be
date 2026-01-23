const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const transactionController = require("../controllers/transactionController");
const kycController = require("../controllers/kycController");
const linkedWalletController = require("../controllers/linkedWalletController");
const { protect, admin } = require("../middleware/auth");
const adminFundController = require("../controllers/adminFundController");

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// User management
router.post("/users/:userId/fund", adminFundController.fundUserAccount);

// Crypto address management
router.post("/crypto-addresses", adminController.addOrUpdateCryptoAddress);
router.get("/crypto-addresses", adminController.getAllCryptoAddresses);
router.get(
  "/crypto-addresses/:cryptocurrency",
  adminController.getCryptoAddress
);
router.put(
  "/crypto-addresses/:cryptocurrency/toggle-status",
  adminController.toggleCryptoAddressStatus
);

// Transaction management
router.get(
  "/transactions/deposits/pending",
  adminController.getPendingDeposits
);
router.get(
  "/transactions/withdrawals/pending",
  adminController.getPendingWithdrawals
);
router.put(
  "/transactions/deposits/:id/confirm",
  transactionController.confirmDeposit
);
router.put(
  "/transactions/deposits/:id/reject",
  transactionController.rejectDeposit
);
router.put(
  "/transactions/withdrawals/:id/approve",
  transactionController.approveWithdrawal
);
router.put(
  "/transactions/withdrawals/:id/reject",
  transactionController.rejectWithdrawal
);
router.put("/transactions/:id/cancel", transactionController.cancelTransaction);

// KYC management
router.get("/kyc/pending", kycController.getPendingKyc);
router.get("/kyc/:id/document", kycController.viewKycDocument);
router.put("/kyc/:id/verify", kycController.verifyKyc);
router.put("/kyc/:id/reject", kycController.rejectKyc);

// Linked wallet management
router.get("/wallets/linked", linkedWalletController.getAllLinkedWallets);

module.exports = router;

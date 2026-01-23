const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const depositController = require("../controllers/depositController"); // Add this
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const {
  depositValidation,
  withdrawalValidation,
} = require("../utils/validators");
const linkedWalletController = require("../controllers/linkedWalletController");

// All routes are protected
router.use(protect);

// Balance routes
router.get("/balance", walletController.getWalletBalances);
router.get("/balance/:cryptocurrency", walletController.getCryptoBalance);

// Deposit address routes
router.get("/deposit/addresses", depositController.getAllDepositAddresses);
router.get(
  "/deposit/address/:cryptocurrency",
  depositController.getDepositAddress
);

// Transaction routes
router.post(
  "/deposit/request",
  validate(depositValidation),
  walletController.requestDeposit
);
router.post(
  "/withdraw/request",
  validate(withdrawalValidation),
  walletController.requestWithdrawal
);
router.get("/transactions", walletController.getTransactionHistory);
router.get("/transactions/:id", walletController.getTransactionById);

// Linked wallet routes
router.post("/link", linkedWalletController.linkWallet);
router.get("/linked", linkedWalletController.getLinkedWallets);
router.get("/linked/:id", linkedWalletController.getLinkedWallet);
router.put("/linked/:id", linkedWalletController.updateLinkedWallet);
router.delete("/linked/:id", linkedWalletController.deleteLinkedWallet);

module.exports = router;

const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");
const { protect } = require("../middleware/auth");
const { uploadKycDocument } = require("../middleware/upload");

// User KYC routes
router.post("/upload", protect, uploadKycDocument, kycController.uploadKyc);
router.get("/status", protect, kycController.getKycStatus);

module.exports = router;

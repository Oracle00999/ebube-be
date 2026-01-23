const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/auth");

// Admin only routes
router.get("/", protect, admin, userController.getAllUsers);
router.get("/:id", protect, admin, userController.getUserById);
router.put("/:id/status", protect, admin, userController.updateUserStatus);
router.get("/:id/wallet", protect, admin, userController.getUserWallet);

// Simple suspension routes (no history)
router.put("/:id/suspend", protect, admin, userController.suspendUser);
router.put("/:id/activate", protect, admin, userController.activateUser);
router.get("/suspended", protect, admin, userController.getSuspendedUsers);

module.exports = router;

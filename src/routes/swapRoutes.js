const express = require("express");
const router = express.Router();
const swapController = require("../controllers/swapController");
const { protect } = require("../middleware/auth");

// All swap routes require authentication
router.use(protect);

// IMPORTANT: Put specific routes BEFORE parameterized routes
router.post("/execute", swapController.executeSwap);
router.get("/history", swapController.getSwapHistory);
router.get("/statistics", swapController.getSwapStatistics); // This should come BEFORE :id
// router.get("/:id", swapController.getSwapDetails); // This should come LAST

module.exports = router;

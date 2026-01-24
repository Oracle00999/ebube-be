const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const adminRoutes = require("./routes/adminRoutes");
const kycRoutes = require("./routes/kycRoutes");
const swapRoutes = require("./routes/swapRoutes");
const { sendEmail } = require("./utils/emailService");

const app = express();

/* -------------------- Middleware -------------------- */

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Routes -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/swap", swapRoutes);

/* -------------------- Health Check -------------------- */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QFS Crypto Wallet API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// Debug: send test email (GET /debug/email-test?to=you@example.com)
app.get("/debug/email-test", async (req, res) => {
  const to = req.query.to || process.env.GMAIL_USER || process.env.EMAIL_FROM;
  try {
    const result = await sendEmail(to, "depositRequest", {
      user: { firstName: "Debug", lastName: "User", email: to },
      transaction: {
        amount: 1,
        cryptocurrency: "btc",
        transactionId: "TEST123",
        createdAt: new Date(),
      },
    });

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Debug email failed:", err);
    res.status(500).json({ success: false, error: err.message || err });
  }
});

/* -------------------- 404 Handler -------------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* -------------------- Error Handler -------------------- */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;

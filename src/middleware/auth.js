const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { UnauthorizedError } = require("../utils/errorHandler");

// Middleware to verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new UnauthorizedError("Not authorized to access this route");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is suspended. Please contact admin.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    next(error);
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

// Middleware to check if user is verified (optional)
const isVerified = (req, res, next) => {
  if (req.user && req.user.isKYCVerified()) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "KYC verification required",
    });
  }
};

module.exports = {
  protect,
  admin,
  isVerified,
};

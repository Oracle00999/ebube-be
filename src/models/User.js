const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES, KYC_STATUS } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },

    // Personal Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      // required: [true, "Country is required"],
      trim: true,
      // default: "Not Specified",
    },

    // Account Information
    role: {
      type: String,
      enum: [USER_ROLES.USER, USER_ROLES.ADMIN],
      default: USER_ROLES.USER,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // KYC Information
    kycStatus: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.NOT_SUBMITTED,
    },

    kycSubmittedAt: {
      type: Date,
    },

    kycVerifiedAt: {
      type: Date,
    },

    // Wallet Reference (one-to-one relationship)
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },

    // Timestamps
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return;

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);

    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error("Password hashing failed: " + error.message);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === USER_ROLES.ADMIN;
};

// Method to check if KYC is verified
userSchema.methods.isKYCVerified = function () {
  return this.kycStatus === KYC_STATUS.VERIFIED;
};

// Ensure virtuals are included when converting to JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = User;

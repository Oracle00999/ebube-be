const mongoose = require("mongoose");
const { KYC_STATUS } = require("../config/constants");

const kycSchema = new mongoose.Schema(
  {
    // User who submitted KYC
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Document type (ID card, passport, driver's license)
    documentType: {
      type: String,
      required: true,
      enum: ["national_id", "passport", "driver_license", "voter_card"],
    },

    // Document number
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Front side of document
    documentFront: {
      type: String, // Path to uploaded file
      required: true,
    },

    // Back side of document (if applicable)
    documentBack: {
      type: String, // Path to uploaded file
    },

    // Selfie with document
    selfieWithDocument: {
      type: String, // Path to uploaded file
    },

    // Status
    status: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.PENDING,
    },

    // Admin who reviewed
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Review notes
    reviewNotes: {
      type: String,
      trim: true,
    },

    // Timestamps
    reviewedAt: {
      type: Date,
    },

    // Expiry date of document
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// kycSchema.index({ user: 1 });
// kycSchema.index({ status: 1 });
// kycSchema.index({ createdAt: -1 });
kycSchema.index({ user: 1, status: 1, createdAt: -1 });

// Method to approve KYC
kycSchema.methods.approve = function (adminId, notes = "") {
  this.status = KYC_STATUS.VERIFIED;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
};

// Method to reject KYC
kycSchema.methods.reject = function (adminId, notes = "") {
  this.status = KYC_STATUS.REJECTED;
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
};

// Method to check if KYC is pending
kycSchema.methods.isPending = function () {
  return this.status === KYC_STATUS.PENDING;
};

// Method to check if KYC is verified
kycSchema.methods.isVerified = function () {
  return this.status === KYC_STATUS.VERIFIED;
};

const Kyc = mongoose.model("Kyc", kycSchema);

module.exports = Kyc;

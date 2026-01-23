const { Kyc, User } = require("../models");
const { successResponse } = require("../utils/responseHandler");
const fs = require("fs");
const path = require("path");

// @desc    Upload KYC document
// @route   POST /api/kyc/upload
// @access  Private
const uploadKyc = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentType, documentNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document uploaded",
      });
    }

    // Check if user already has pending or verified KYC
    const existingKyc = await Kyc.findOne({ user: userId });

    if (existingKyc) {
      // Delete old file if exists
      if (
        existingKyc.documentFront &&
        fs.existsSync(existingKyc.documentFront)
      ) {
        fs.unlinkSync(existingKyc.documentFront);
      }

      // Update existing KYC
      existingKyc.documentType = documentType;
      existingKyc.documentNumber = documentNumber;
      existingKyc.documentFront = req.file.path;
      existingKyc.status = "pending";
      existingKyc.reviewedBy = null;
      existingKyc.reviewedAt = null;
      existingKyc.reviewNotes = null;

      await existingKyc.save();

      // Update user KYC status
      await User.findByIdAndUpdate(userId, {
        kycStatus: "pending",
        kycSubmittedAt: new Date(),
      });
    } else {
      // Create new KYC
      await Kyc.create({
        user: userId,
        documentType: documentType,
        documentNumber: documentNumber,
        documentFront: req.file.path,
        status: "pending",
      });

      // Update user KYC status
      await User.findByIdAndUpdate(userId, {
        kycStatus: "pending",
        kycSubmittedAt: new Date(),
      });
    }

    successResponse(
      res,
      {},
      "KYC document uploaded successfully. Waiting for admin verification."
    );
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get KYC status
// @route   GET /api/kyc/status
// @access  Private
const getKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "kycStatus kycSubmittedAt kycVerifiedAt"
    );
    const kyc = await Kyc.findOne({ user: userId });

    const response = {
      kycStatus: user.kycStatus,
      kycSubmittedAt: user.kycSubmittedAt,
      kycVerifiedAt: user.kycVerifiedAt,
    };

    if (kyc) {
      response.documentType = kyc.documentType;
      response.documentNumber = kyc.documentNumber;
      response.uploadedAt = kyc.createdAt;
      response.reviewedAt = kyc.reviewedAt;
      response.reviewNotes = kyc.reviewNotes;
    }

    successResponse(res, response, "KYC status retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending KYC submissions (Admin)
// @route   GET /api/admin/kyc/pending
// @access  Private/Admin
const getPendingKyc = async (req, res, next) => {
  try {
    const pendingKyc = await Kyc.find({ status: "pending" })
      .populate("user", "firstName lastName email createdAt")
      .sort({ createdAt: 1 });

    const formattedKyc = pendingKyc.map((kyc) => ({
      id: kyc._id,
      user: {
        id: kyc.user._id,
        name: `${kyc.user.firstName} ${kyc.user.lastName}`,
        email: kyc.user.email,
        joinedAt: kyc.user.createdAt,
      },
      documentType: kyc.documentType,
      documentNumber: kyc.documentNumber,
      submittedAt: kyc.createdAt,
      documentFront: `/api/admin/kyc/${kyc._id}/document`, // API endpoint to view document
    }));

    successResponse(
      res,
      {
        pendingKyc: formattedKyc,
        count: formattedKyc.length,
      },
      "Pending KYC submissions retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    View KYC document (Admin)
// @route   GET /api/admin/kyc/:id/document
// @access  Private/Admin
const viewKycDocument = async (req, res, next) => {
  try {
    const kycId = req.params.id;

    const kyc = await Kyc.findById(kycId).populate(
      "user",
      "firstName lastName"
    );

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    if (!kyc.documentFront || !fs.existsSync(kyc.documentFront)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found",
      });
    }

    // Send the file
    res.sendFile(path.resolve(kyc.documentFront));
  } catch (error) {
    next(error);
  }
};

// @desc    Verify KYC (Admin)
// @route   PUT /api/admin/kyc/:id/verify
// @access  Private/Admin
const verifyKyc = async (req, res, next) => {
  try {
    const kycId = req.params.id;
    const adminId = req.user.id;

    const kyc = await Kyc.findById(kycId).populate("user");

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    if (kyc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `KYC is already ${kyc.status}`,
      });
    }

    // Approve KYC
    kyc.approve(adminId);
    await kyc.save();

    // Update user KYC status
    await User.findByIdAndUpdate(kyc.user._id, {
      kycStatus: "verified",
      kycVerifiedAt: new Date(),
    });

    successResponse(
      res,
      {
        kyc: {
          id: kyc._id,
          user: {
            name: `${kyc.user.firstName} ${kyc.user.lastName}`,
            email: kyc.user.email,
          },
          documentType: kyc.documentType,
          status: kyc.status,
          reviewedAt: kyc.reviewedAt,
        },
      },
      "KYC verified successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reject KYC (Admin)
// @route   PUT /api/admin/kyc/:id/reject
// @access  Private/Admin
const rejectKyc = async (req, res, next) => {
  try {
    const kycId = req.params.id;
    const adminId = req.user.id;

    const kyc = await Kyc.findById(kycId).populate("user");

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC document not found",
      });
    }

    if (kyc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `KYC is already ${kyc.status}`,
      });
    }

    // Reject KYC
    kyc.reject(adminId);
    await kyc.save();

    // Update user KYC status
    await User.findByIdAndUpdate(kyc.user._id, {
      kycStatus: "rejected",
    });

    successResponse(
      res,
      {
        kyc: {
          id: kyc._id,
          user: {
            name: `${kyc.user.firstName} ${kyc.user.lastName}`,
            email: kyc.user.email,
          },
          documentType: kyc.documentType,
          status: kyc.status,
          reviewedAt: kyc.reviewedAt,
        },
      },
      "KYC rejected successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadKyc,
  getKycStatus,
  getPendingKyc,
  viewKycDocument,
  verifyKyc,
  rejectKyc,
};

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/kyc");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `kyc_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, JPG, PNG) and PDF files are allowed"));
  }
};

// Create upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
const uploadKycDocument = upload.single("document");

// Middleware for multiple files (for KYC with multiple documents)
const uploadKycDocuments = upload.fields([
  { name: "documentFront", maxCount: 1 },
  { name: "documentBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

module.exports = {
  uploadKycDocument,
  uploadKycDocuments,
};

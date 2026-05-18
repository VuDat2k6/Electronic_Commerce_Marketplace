/**
 * Main Images Routes
 * 
 * Secure file upload endpoints:
 * - POST /api/main-image - Upload a main image (auth required)
 * - DELETE /api/main-image/:filename - Delete an image (auth required)
 * 
 * @module routes/mainImages
 */

const express = require("express");
const router = express.Router();

const { uploadMainImage, deleteMainImage } = require("../controllers/mainImages");
const { authenticate, requireSellerOrAdmin } = require("../middleware/auth");

// POST /api/main-image - Upload main image
router.route("/").post(authenticate, requireSellerOrAdmin, uploadMainImage);

// DELETE /api/main-image/:filename - Delete image
router.delete("/:filename", authenticate, requireSellerOrAdmin, deleteMainImage);

module.exports = router;

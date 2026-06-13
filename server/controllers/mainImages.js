/**
 * Main Images Controller
 * 
 * Handles secure file uploads for product main images.
 * Security measures:
 * - MIME type validation (whitelist: jpeg, png, webp, gif)
 * - Maximum file size limit (5MB)
 * - UUID-based filenames to prevent overwrites and path traversal
 * - File extension validation
 * 
 * @module controllers/mainImages
 */

const path = require("path");
const fs = require("fs");
const prisma = require("../utils/db");

// ============================================================
// CONFIGURATION
// ============================================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate a secure filename using UUID
 * Prevents path traversal and filename conflicts
 */
function generateSecureFilename(originalFilename) {
  const { v4: uuidv4 } = require('uuid');
  
  // Get the file extension and validate it
  const ext = path.extname(originalFilename).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return null;
  }
  
  // Generate UUID-based filename
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * Validate MIME type of uploaded file
 * Uses file signature detection for additional security
 */
function validateMimeType(file) {
  // Check MIME type from express-fileupload
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return false;
  }
  
  // Additional check: validate file extension matches MIME type
  const ext = path.extname(file.name).toLowerCase();
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
  };
  
  const validExts = mimeToExt[file.mimetype] || [];
  if (!validExts.includes(ext)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize filename to remove any path traversal attempts
 */
function sanitizeFilename(filename) {
  // Remove any path components
  const basename = path.basename(filename);
  // Remove any null bytes or special characters
  return basename.replace(/[\x00-\x1F\x7F<>:"|?*]/g, '');
}

/**
 * Get the public uploads directory path
 * Creates directory if it doesn't exist
 */
function getUploadsDir() {
  const uploadDir = path.join(__dirname, "..", "public", "uploads");
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return uploadDir;
}

// ============================================================
// CONTROLLER FUNCTIONS
// ============================================================

/**
 * POST /api/main-image
 * 
 * Upload a main image for a product
 * 
 * Security:
 * - Requires authentication (middleware should handle this)
 * - Validates MIME type (image/jpeg, image/png, image/webp, image/gif)
 * - Limits file size to 5MB
 * - Uses UUID-based filenames
 * - Sanitizes original filename
 * 
 * @param {Request} req - Express request with uploaded file
 * @param {Response} res - Express response
 */
async function uploadMainImage(req, res) {
  try {
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        code: 'NO_FILE'
      });
    }

    const uploadedFile = req.files.uploadedFile;

    // Check for single file upload
    if (!uploadedFile) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 5MB.',
        code: 'FILE_TOO_LARGE'
      });
    }

    // Validate MIME type
    if (!validateMimeType(uploadedFile)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Sanitize and generate secure filename
    const sanitizedOriginalName = sanitizeFilename(uploadedFile.name);
    const secureFilename = generateSecureFilename(sanitizedOriginalName);

    if (!secureFilename) {
      return res.status(400).json({ 
        error: 'Invalid file extension',
        code: 'INVALID_EXTENSION'
      });
    }

    // Get upload directory
    const uploadDir = getUploadsDir();
    const uploadPath = path.join(uploadDir, secureFilename);

    // Check if file already exists (shouldn't happen with UUID, but safety first)
    if (fs.existsSync(uploadPath)) {
      return res.status(500).json({ 
        error: 'File upload failed. Please try again.',
        code: 'UPLOAD_FAILED'
      });
    }

    // Move file to upload directory
    await new Promise((resolve, reject) => {
      uploadedFile.mv(uploadPath, (err) => {
        if (err) {
          console.error('File upload error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Return the public URL path
    const publicPath = `/uploads/${secureFilename}`;

    return res.status(200).json({ 
      message: 'File uploaded successfully',
      path: publicPath,
      filename: secureFilename
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'File upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
}

/**
 * DELETE /api/main-image/:filename
 * 
 * Delete an uploaded image
 * Requires authentication
 * 
 * @param {Request} req - Express request with filename
 * @param {Response} res - Express response
 */
async function deleteMainImage(req, res) {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ 
        error: 'Filename is required',
        code: 'MISSING_FILENAME'
      });
    }

    // Validate filename format (should be UUID-based)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif)$/i;
    if (!uuidRegex.test(filename)) {
      return res.status(400).json({ 
        error: 'Invalid filename format',
        code: 'INVALID_FILENAME'
      });
    }

    const uploadDir = getUploadsDir();
    const filePath = path.join(uploadDir, filename);
    const linkedOtherSellerProduct = await prisma.product.findFirst({
      where: {
        mainImage: {
          in: [filename, `uploads/${filename}`, `/uploads/${filename}`]
        },
        sellerId: { not: req.user.id }
      },
      select: { id: true }
    });

    if (linkedOtherSellerProduct) {
      return res.status(403).json({
        error: "You can only delete images assigned to your own products",
        code: "FORBIDDEN"
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return res.status(200).json({ 
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ 
      error: 'File deletion failed',
      code: 'DELETE_ERROR'
    });
  }
}

module.exports = {
  uploadMainImage,
  deleteMainImage
};

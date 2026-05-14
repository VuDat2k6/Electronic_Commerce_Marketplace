const prisma = require("../utills/db");
const path = require("path");

/**
 * Handle an HTTP file upload and save the uploaded file to the server's public directory.
 *
 * Responds with HTTP 400 and JSON `{ message: "No files uploaded" }` if no files are present.
 * Attempts to move `req.files.uploadedFile` into the server `public` directory; on error responds with HTTP 500 and the error, on success responds with HTTP 200 and JSON `{ message: "File uploaded successfully" }`.
 *
 * @param {import('express').Request & { files?: Record<string, { name: string, mv: (dest: string, cb: (err: any) => void) => void }> }} req - Express request; expects `req.files.uploadedFile` to be the uploaded file object.
 * @param {import('express').Response} res - Express response used to send status and JSON responses.
 */
async function uploadMainImage(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  // Get file from a request
  const uploadedFile = req.files.uploadedFile;

  // Using mv method for moving file to the directory on the server
  const uploadPath = path.join(__dirname, "..", "public", uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.status(200).json({ message: "File uploaded successfully" });
  });
}

module.exports = {
  uploadMainImage
};
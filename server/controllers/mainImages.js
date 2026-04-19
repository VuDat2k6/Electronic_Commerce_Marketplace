const { PrismaClient } = require("@prisma/client");
const prisma = require("../utills/db"); // ✅ Use shared connection
const path = require("path");

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
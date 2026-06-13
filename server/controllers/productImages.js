const prisma = require("../utils/db");

async function canMutateProductImages(request, response, productID) {
  if (!productID) {
    response.status(400).json({ error: "Product ID is required" });
    return false;
  }

  const product = await prisma.product.findUnique({
    where: { id: String(productID) },
    select: { sellerId: true },
  });

  if (!product) {
    response.status(404).json({ error: "Product not found" });
    return false;
  }

  if (product.sellerId !== request.user.id) {
    response.status(403).json({ error: "You can only manage images for your own products" });
    return false;
  }

  return true;
}

/**
 * Fetches and sends all image records for the product identified by `request.params.id`.
 *
 * Sends a 404 response with `{ error: "Images not found" }` when no images exist for the product; otherwise sends the images array as JSON.
 * @param {import('express').Request} request - Express request; expects `request.params.id` to contain the product ID.
 * @param {import('express').Response} response - Express response used to send the result.
 */
async function getSingleProductImages(request, response) {
  const { id } = request.params;
  const images = await prisma.image.findMany({
    where: { productID: id },
  });

  if (!images || images.length === 0) {
    return response.status(404).json({ error: "Images not found" });
  }

  return response.json(images);
}

async function createImage(request, response) {
  try {
    const { productID, image } = request.body;
    if (!(await canMutateProductImages(request, response, productID))) return;

    const createImage = await prisma.image.create({
      data: {
        productID: String(productID),
        image,
      },
    });
    return response.status(201).json(createImage);
  } catch (error) {
    console.error("Error creating image:", error);
    return response.status(500).json({ error: "Error creating image" });
  }
}

async function updateImage(request, response) {
  try {
    const { id } = request.params;
    const { productID, image } = request.body;

    if (!(await canMutateProductImages(request, response, id))) return;
    if (productID && String(productID) !== String(id)) {
      return response.status(400).json({ error: "Product ID cannot be changed for an image" });
    }

    const existingImage = await prisma.image.findFirst({
      where: {
        productID: String(id),
      },
    });

    if (!existingImage) {
      return response
        .status(404)
        .json({ error: "Image not found for the provided productID" });
    }

    const updatedImage = await prisma.image.update({
      where: {
        imageID: existingImage.imageID,
      },
      data: {
        productID: String(id),
        image,
      },
    });

    return response.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return response.status(500).json({ error: "Error updating image" });
  }
}

async function deleteImage(request, response) {
  try {
    const { id } = request.params;
    if (!(await canMutateProductImages(request, response, id))) return;

    await prisma.image.deleteMany({
      where: {
        productID: String(id),
      },
    });
    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting image:", error);
    return response.status(500).json({ error: "Error deleting image" });
  }
}

module.exports = {
  getSingleProductImages,
  createImage,
  updateImage,
  deleteImage,
};

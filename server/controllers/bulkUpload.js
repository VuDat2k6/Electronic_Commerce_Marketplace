const prisma = require("../utils/db");
const { asyncHandler, AppError } = require("../utils/errorHandler");
const {
  parseCsvBufferToRows,
  validateRow,
  createBatchWithItems,
  computeBatchStatus,
  getBatchSummary,
  applyItemUpdates,
} = require("../services/bulkUploadService");

async function getOwnedBatch(req, batchId) {
  const batch = await prisma.bulk_upload_batch.findFirst({
    where: { id: batchId, userId: req.user.id },
  });

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  return batch;
}

async function assertOwnedBatchProducts(req, batchId, itemIds) {
  const items = await prisma.bulk_upload_item.findMany({
    where: {
      batchId,
      ...(itemIds ? { id: { in: itemIds } } : {}),
      productId: { not: null },
    },
    include: { product: { select: { sellerId: true } } },
  });

  if (items.some((item) => item.product && item.product.sellerId !== req.user.id)) {
    throw new AppError("Batch contains a product outside your shop", 403);
  }

  return items;
}

const uploadCsvAndCreateBatch = asyncHandler(async (req, res) => {
  const csvFile = req.files?.file;
  if (!csvFile) {
    throw new AppError("CSV file is required (field name: 'file')", 400);
  }

  const rows = await parseCsvBufferToRows(csvFile.data);
  if (!rows || rows.length === 0) {
    throw new AppError("CSV has no rows", 400);
  }

  const valid = [];
  const errors = [];
  rows.forEach((row, index) => {
    const validation = validateRow(row);
    if (validation.ok) valid.push(validation.data);
    else errors.push({ index: index + 1, error: validation.error });
  });

  const result = await prisma.$transaction(async (tx) => {
    const createdBatch = await tx.bulk_upload_batch.create({
      data: {
        fileName: csvFile.name,
        status: "PENDING",
        itemCount: rows.length,
        errorCount: errors.length,
        userId: req.user.id,
      },
    });

    const { successCount, errorCount } = await createBatchWithItems(
      tx,
      createdBatch.id,
      valid,
      errors,
      req.user.id
    );

    return tx.bulk_upload_batch.update({
      where: { id: createdBatch.id },
      data: {
        status: computeBatchStatus(successCount, errorCount),
        itemCount: successCount + errorCount,
        errorCount,
      },
    });
  });

  const summary = await getBatchSummary(prisma, result.id);
  return res.status(201).json({
    batchId: result.id,
    status: result.status,
    successful: summary.created,
    ...summary,
    validationErrors: errors,
  });
});

const listBatches = asyncHandler(async (req, res) => {
  const batches = await prisma.bulk_upload_batch.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  const batchesWithDetails = await Promise.all(
    batches.map(async (batch) => {
      const items = await prisma.bulk_upload_item.findMany({
        where: { batchId: batch.id },
      });
      const errors = items.filter((item) => item.error).map((item) => item.error);

      return {
        id: batch.id,
        fileName: batch.fileName || `batch-${batch.id.substring(0, 8)}.csv`,
        totalRecords: items.length,
        successfulRecords: items.filter(
          (item) => item.status === "CREATED" && item.productId !== null
        ).length,
        failedRecords: items.filter(
          (item) => item.status === "ERROR" || item.error !== null
        ).length,
        itemCount: batch.itemCount,
        errorCount: batch.errorCount,
        createdAt: batch.createdAt,
        status: batch.status,
        uploadedBy: req.user.email,
        uploadedAt: batch.createdAt,
        errors: errors.length > 0 ? errors : undefined,
      };
    })
  );

  return res.json({ batches: batchesWithDetails });
});

const getBatchDetail = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  if (!batchId) throw new AppError("Batch ID is required", 400);

  const batch = await getOwnedBatch(req, batchId);
  const items = await prisma.bulk_upload_item.findMany({
    where: { batchId },
    include: { product: true },
  });

  return res.json({ batch, items });
});

const updateBatchItems = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { items } = req.body;
  if (!batchId) throw new AppError("Batch ID is required", 400);
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Items array is required", 400);
  }

  await getOwnedBatch(req, batchId);
  await assertOwnedBatchProducts(
    req,
    batchId,
    items.map((item) => item.itemId)
  );

  const updated = await prisma.$transaction((tx) => applyItemUpdates(tx, batchId, items));
  return res.json({ updatedCount: updated.length, items: updated });
});

const deleteBatch = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const deleteProducts = req.query.deleteProducts === "true";
  if (!batchId) throw new AppError("Batch ID is required", 400);

  await getOwnedBatch(req, batchId);
  if (!deleteProducts) {
    await prisma.$transaction(async (tx) => {
      await tx.bulk_upload_item.deleteMany({ where: { batchId } });
      await tx.bulk_upload_batch.delete({ where: { id: batchId } });
    });
    return res.json({
      success: true,
      message: "Batch deleted successfully (products kept)",
      deletedProducts: false,
    });
  }

  const items = await assertOwnedBatchProducts(req, batchId);
  const productIds = items.map((item) => item.productId).filter(Boolean);
  const [legacyReferences, checkoutReferences] = await Promise.all([
    prisma.order_item.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true },
    }),
    prisma.subOrderProduct.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true },
    }),
  ]);
  const referencedIds = new Set(
    [...legacyReferences, ...checkoutReferences].map((item) => item.productId)
  );
  const archivedProductIds = productIds.filter((id) => referencedIds.has(id));
  const removableProductIds = productIds.filter((id) => !referencedIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (archivedProductIds.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: archivedProductIds }, sellerId: req.user.id },
        data: { status: "ARCHIVED", inStock: 0 },
      });
    }
    if (removableProductIds.length > 0) {
      await tx.product.deleteMany({
        where: { id: { in: removableProductIds }, sellerId: req.user.id },
      });
    }
    await tx.bulk_upload_item.deleteMany({ where: { batchId } });
    await tx.bulk_upload_batch.delete({ where: { id: batchId } });
  });

  return res.json({
    success: true,
    message: "Batch removed and its products taken off sale",
    deletedProducts: true,
    archivedProductCount: archivedProductIds.length,
    deletedProductCount: removableProductIds.length,
  });
});

module.exports = {
  uploadCsvAndCreateBatch,
  listBatches,
  getBatchDetail,
  updateBatchItems,
  deleteBatch,
};

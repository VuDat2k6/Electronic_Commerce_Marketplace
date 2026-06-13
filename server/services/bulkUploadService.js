const { parse } = require("csv-parse/sync");

const MAX_BULK_ERROR_LENGTH = 180;

function truncateBulkError(message) {
  const value = String(message || "Create failed").replace(/\s+/g, " ").trim();
  if (value.length <= MAX_BULK_ERROR_LENGTH) return value;
  return `${value.slice(0, MAX_BULK_ERROR_LENGTH - 3)}...`;
}

function formatCreateError(error, row) {
  if (error?.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unique field";
    if (target.includes("slug")) return `Slug already exists: ${row.slug}`;
    return `Duplicate value for ${target}`;
  }

  if (error?.code === "P2000") {
    return `A field is too long: ${error.meta?.column_name || "unknown column"}`;
  }

  return error?.message || "Create failed";
}

// Validate a single CSV row according to the Product schema constraints
function validateRow(row) {
  const errs = [];
  const clean = {};

  const title = String(row.title ?? "").trim();
  const slug = String(row.slug ?? "").trim();
  const price = Number(row.price);
  const categoryId = String(row.categoryId ?? row.categoryName ?? row.category ?? "").trim();
  const inStock = Number(row.inStock ?? 0);

  if (!title) errs.push("title is required");
  if (!slug) errs.push("slug is required");
  if (!Number.isInteger(price) || price <= 0)
    errs.push("price must be a positive whole VND amount");
  if (!categoryId) errs.push("categoryId is required");
  if (!Number.isInteger(inStock) || inStock < 0)
    errs.push("inStock must be a non-negative whole number");

  if (errs.length) return { ok: false, error: errs.join(", ") };

  clean.title = title;
  clean.slug = slug;
  clean.price = price;
  clean.categoryId = categoryId;
  clean.inStock = inStock;

  clean.manufacturer = row.manufacturer
    ? String(row.manufacturer).trim()
    : null;
  clean.description = row.description ? String(row.description).trim() : null;
  clean.mainImage = row.mainImage ? String(row.mainImage).trim() : null;

  return { ok: true, data: clean };
}

async function parseCsvBufferToRows(buffer) {
  const text = buffer.toString("utf-8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

function computeBatchStatus(successCount, errorCount) {
  if (successCount > 0 && errorCount === 0) return "COMPLETED";
  if (successCount > 0 && errorCount > 0) return "PARTIAL";
  if (successCount === 0 && errorCount > 0) return "FAILED";
  return "PENDING";
}

// Create products + items for valid rows, error items for invalid
async function createBatchWithItems(tx, batchId, validRows, errorRows, sellerId) {
  if (!sellerId) {
    throw new Error("Seller ID is required for bulk product upload");
  }

  // Fetch all categories once so CSV can use category ID, exact name, or lower-case name.
  const categories = await tx.category.findMany({
    select: { id: true, name: true },
  });

  // Create a map for both ID and name lookup
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat.id); // UUID -> UUID
    categoryMap.set(cat.name.toLowerCase(), cat.id); // name -> UUID
  });

  let success = 0;
  let failed = 0;

  for (const row of validRows) {
    // Try to resolve categoryId (could be UUID or category name)
    const resolvedCategoryId =
      categoryMap.get(row.categoryId) ||
      categoryMap.get(row.categoryId.toLowerCase());

    if (!resolvedCategoryId) {
      await tx.bulk_upload_item.create({
        data: {
          batchId,
          title: row.title,
          slug: row.slug,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: row.categoryId,
          inStock: row.inStock,
          status: "ERROR",
          error: truncateBulkError(`Category not found: ${row.categoryId}`),
        },
      });
      failed++;
      continue;
    }

    try {
      const product = await tx.product.create({
        data: {
          sellerId,
          title: row.title,
          slug: row.slug,
          price: row.price,
          rating: 5,
          description: row.description ?? "",
          manufacturer: row.manufacturer ?? "",
          mainImage: row.mainImage ?? "",
          categoryId: resolvedCategoryId, // Use resolved category ID
          inStock: row.inStock,
          status: "PUBLISHED",
        },
      });

      await tx.bulk_upload_item.create({
        data: {
          batchId,
          productId: product.id,
          title: row.title,
          slug: row.slug,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: resolvedCategoryId, // Use resolved category ID
          inStock: row.inStock,
          status: "CREATED",
          error: null,
        },
      });
      success++;
    } catch (e) {
      await tx.bulk_upload_item.create({
        data: {
          batchId,
          title: row.title,
          slug: row.slug,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: resolvedCategoryId || row.categoryId,
          inStock: row.inStock,
          status: "ERROR",
          error: truncateBulkError(formatCreateError(e, row)),
        },
      });
      failed++;
    }
  }

  for (const err of errorRows) {
    await tx.bulk_upload_item.create({
      data: {
        batchId,
        title: "",
        slug: "",
        price: 0,
        manufacturer: null,
        description: null,
        mainImage: null,
        categoryId: "",
        inStock: 0,
        status: "ERROR",
        error: truncateBulkError(`Row ${err.index}: ${err.error}`),
      },
    });
    failed++;
  }

  return { successCount: success, errorCount: failed };
}

async function getBatchSummary(prisma, batchId) {
  const total = await prisma.bulk_upload_item.count({ where: { batchId } });
  const errors = await prisma.bulk_upload_item.count({
    where: { batchId, status: "ERROR" },
  });
  const created = await prisma.bulk_upload_item.count({
    where: { batchId, status: "CREATED" },
  });
  const updated = await prisma.bulk_upload_item.count({
    where: { batchId, status: "UPDATED" },
  });
  return { total, errors, created, updated };
}

async function canDeleteProductsForBatch(prisma, batchId) {
  const items = await prisma.bulk_upload_item.findMany({
    where: { batchId, productId: { not: null } },
    select: { productId: true },
  });
  const productIds = items.map((i) => i.productId).filter(Boolean);

  if (productIds.length === 0) {
    return { canDelete: true, blockedProductIds: [] };
  }

  const referenced = await prisma.subOrderProduct.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });

  const blocked = new Set(referenced.map((r) => r.productId));
  const blockedList = productIds.filter((id) => blocked.has(id));

  if (blockedList.length > 0) {
    return {
      canDelete: false,
      reason: "Some products are in orders",
      blockedProductIds: blockedList,
    };
  }

  return { canDelete: true, blockedProductIds: [] };
}

async function applyItemUpdates(tx, batchId, updates) {
  // updates: [{ itemId, price, inStock }]
  const ids = updates.map((u) => u.itemId);
  const items = await tx.bulk_upload_item.findMany({
    where: { id: { in: ids }, batchId },
    select: { id: true, productId: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  const result = [];

  for (const upd of updates) {
    const current = byId.get(upd.itemId);
    if (!current) continue;

    const price = Number(upd.price);
    const inStock = Number(upd.inStock);

    if (!Number.isInteger(price) || price <= 0) continue;
    if (!Number.isInteger(inStock) || inStock < 0) continue;

    if (current.productId) {
      await tx.product.update({
        where: { id: current.productId },
        data: { price, inStock },
      });
    }

    const updatedItem = await tx.bulk_upload_item.update({
      where: { id: upd.itemId },
      data: { price, inStock, status: "UPDATED", error: null },
    });
    result.push(updatedItem);
  }
  return result;
}

module.exports = {
  parseCsvBufferToRows,
  validateRow,
  createBatchWithItems,
  computeBatchStatus,
  getBatchSummary,
  canDeleteProductsForBatch,
  applyItemUpdates,
};

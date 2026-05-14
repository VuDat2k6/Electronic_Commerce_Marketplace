const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

/**
 * Update all products with status "DRAFT" to "PUBLISHED" and log how many were changed.
 */
async function main() {
  const result = await p.product.updateMany({
    where: { status: "DRAFT" },
    data: { status: "PUBLISHED" }
  });
  console.log("Updated", result.count, "products to PUBLISHED");
}

main()
  .then(() => p.$disconnect())
  .catch(e => { console.error(e); p.$disconnect(); });

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

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

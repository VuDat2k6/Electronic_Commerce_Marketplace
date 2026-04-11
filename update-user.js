const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateUser() {
  const user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "seller" }
    });
    console.log("Updated user role to seller:", user.email);
  } else {
    console.log("No user found");
  }
  await prisma.$disconnect();
}

updateUser();

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required");
  }

  const preferredName = process.env.ADMIN_USER_NAME?.trim();
  const adminUser = preferredName
    ? (await prisma.user.findFirst({
        where: { name: preferredName, role: "admin" },
        select: { id: true, name: true },
      })) ??
      (await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      }))
    : await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { id: "asc" },
        select: { id: true, name: true },
      });

  if (!adminUser) {
    throw new Error("No admin user was found");
  }

  await prisma.user.update({
    where: { id: adminUser.id },
    data: { passwordHash: await hashPassword(password) },
  });

  console.log(`Updated password hash for admin user: ${adminUser.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

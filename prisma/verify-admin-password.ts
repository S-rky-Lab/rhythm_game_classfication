import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminsWithPassword = await prisma.user.count({
    where: {
      role: "admin",
      passwordHash: { not: null },
    },
  });

  if (adminsWithPassword === 0) {
    throw new Error(
      "No administrator has a password hash. Run `npm run set-admin-password` before starting the application."
    );
  }

  console.log(
    `Verified ${adminsWithPassword} administrator with a password hash.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

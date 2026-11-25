import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { specialities } from "../src/lib/constants";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = new PrismaClient();
async function main() {
  for (const { id, name, nameFr } of specialities)
    await db.speciality.upsert({
      where: { id },
      create: { id, name, nameFr },
      update: { name, nameFr },
    });
  await db.platformSettings.upsert({
    where: { id: "platform" },
    create: {},
    update: {},
  });
  console.log(
    "Seed complete: six specialities and platform settings. No public or default accounts created.",
  );
}
main()
  .catch(() => {
    console.error("Seed failed. Check database connectivity and migrations.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

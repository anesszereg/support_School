import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { z } from "zod";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = new PrismaClient();
async function hiddenPassword(): Promise<string> {
  if (process.env.ADMIN_SETUP_PASSWORD) return process.env.ADMIN_SETUP_PASSWORD;
  if (!process.stdin.isTTY)
    throw new Error(
      "Run in an interactive terminal or provide ADMIN_SETUP_PASSWORD securely.",
    );
  process.stdout.write("Administrator password (12+ characters; hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", handler);
      process.stdout.write("\n");
    }
    function handler(chunk: string) {
      for (const c of chunk) {
        if (c === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (c === "\r" || c === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (c === "\u007f") value = value.slice(0, -1);
        else if (c >= " ") value += c;
      }
    }
    process.stdin.on("data", handler);
  });
}
async function main() {
  if (await db.user.count({ where: { role: "ADMIN" } }))
    throw new Error("An administrator already exists. Setup is locked.");
  let username = process.env.ADMIN_SETUP_USERNAME;
  if (!username) {
    const input = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    username = await input.question("Administrator username: ");
    input.close();
  }
  const data = z
    .object({
      username: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_.-]{3,60}$/),
      password: z.string().min(12).max(128),
    })
    .parse({ username, password: await hiddenPassword() });
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(27012027)`;
    if (await tx.user.count({ where: { role: "ADMIN" } }))
      throw new Error("Setup is locked.");
    const admin = await tx.user.create({
      data: {
        username: data.username,
        passwordHash: await hash(data.password, 12),
        firstName: "عصام",
        lastName: "بن بليل",
        role: "ADMIN",
        mustChangePassword: false,
      },
    });
    await tx.auditLog.create({
      data: { actorId: admin.id, action: "admin.initial_setup" },
    });
  });
  console.log("Administrator created. Sign in at /login.");
}
main()
  .catch((e) => {
    console.error(
      e instanceof z.ZodError
        ? "Invalid username or password length."
        : e.message,
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

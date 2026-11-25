import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db, databaseConfigured } from "@/lib/db";
export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [
    Credentials({
      credentials: { username: {}, password: { type: "password" } },
      async authorize(raw) {
        if (!databaseConfigured()) return null;
        const parsed = z
          .object({
            username: z.string().min(1).max(60),
            password: z.string().min(1).max(128),
          })
          .safeParse(raw);
        if (!parsed.success) return null;
        const username = parsed.data.username.toLowerCase().trim();
        const key = createHash("sha256").update(username).digest("hex");
        const [limit] = await db.$queryRaw<{ count: number }[]>`
          INSERT INTO "RateLimit" ("key", "count", "resetsAt")
          VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
          ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE WHEN "RateLimit"."resetsAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
            "resetsAt" = CASE WHEN "RateLimit"."resetsAt" <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE "RateLimit"."resetsAt" END
          RETURNING "count"
        `;
        if (limit.count > 10) return null;
        const user = await db.user.findUnique({ where: { username } });
        const valid = await compare(
          parsed.data.password,
          user?.passwordHash ??
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxCUB4y9G49iYxykFb0XAKxZ6F2",
        );
        if (!user || !valid || user.status !== "ACTIVE") return null;
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          version: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.version = (user as unknown as { version: number }).version;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && databaseConfigured()) {
        const user = await db.user.findUnique({
          where: { id: String(token.uid) },
          select: { id: true, sessionVersion: true, status: true },
        });
        if (user?.status === "ACTIVE" && user.sessionVersion === token.version)
          session.user.id = user.id;
        else session.user.id = "";
      }
      return session;
    },
  },
});

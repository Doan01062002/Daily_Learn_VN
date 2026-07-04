import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Extracts the direct PostgreSQL connection string from the Prisma Postgres (prisma+postgres://) URL
 * by base64-decoding the api_key query parameter. Returns the original URL if not prisma+postgres.
 */
function getDirectConnectionString(url: string): string {
  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsedUrl = new URL(url);
      const apiKey = parsedUrl.searchParams.get("api_key");
      if (apiKey) {
        const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
        const json = JSON.parse(decoded);
        if (json.databaseUrl) {
          return json.databaseUrl;
        }
      }
    } catch (error) {
      console.error("Failed to parse Prisma Postgres DATABASE_URL, using fallback:", error);
    }
  }
  return url;
}

const rawConnectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
const directConnectionString = getDirectConnectionString(rawConnectionString);

const pool = new Pool({ connectionString: directConnectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

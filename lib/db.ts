import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Surfaced only at runtime when a query is attempted, not at build time.
  console.warn("DATABASE_URL is not set. Database queries will fail until it is configured.");
}

// A valid-format placeholder keeps neon() from throwing at import time during
// the build. No query runs at build, so this is never actually connected to.
// At runtime the real DATABASE_URL from the environment is used.
export const sql = neon(process.env.DATABASE_URL || "postgresql://user:pass@placeholder.neon.tech/db");

// Maximum guests a single home can host.
export const MAX_GUESTS = 5;

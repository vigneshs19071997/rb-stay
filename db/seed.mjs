// One-time setup: applies the schema, seeds the two homes, and creates the admin user.
// Usage: npm run db:setup   (reads DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD from .env.local / .env)

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader so this runs without extra dependencies.
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(join(__dirname, "..", file), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* file not present — fine */
    }
  }
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const adminEmail = process.env.ADMIN_EMAIL || "admin@rbcomfortstay.in";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe@123";

  console.log("→ Applying schema…");
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  // neon's http driver runs one statement per call; split on semicolons.
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql(stmt);
  }

  console.log("→ Seeding homes…");
  const homes = [
    { name: "RB Comfort Stay — Home 1", description: "A bright, fully-furnished home with comfortable bedrooms, a family living space and a modern kitchen. Sleeps up to 5 guests.", max_guests: 5 },
    { name: "RB Comfort Stay — Home 2", description: "A peaceful retreat with spacious rooms and all essentials for a relaxed stay near Vellore. Sleeps up to 5 guests.", max_guests: 5 },
  ];
  for (const h of homes) {
    const existing = await sql`SELECT id FROM homes WHERE name = ${h.name}`;
    if (existing.length === 0) {
      await sql`INSERT INTO homes (name, description, max_guests) VALUES (${h.name}, ${h.description}, ${h.max_guests})`;
      console.log(`  + ${h.name}`);
    } else {
      await sql`UPDATE homes SET description = ${h.description}, max_guests = ${h.max_guests} WHERE name = ${h.name}`;
      console.log(`  · ${h.name} (updated)`);
    }
  }

  console.log("→ Creating admin account…");
  const existingAdmin = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
  if (existingAdmin.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await sql`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ('Administrator', ${adminEmail}, '9092189883', ${hash}, 'admin')
    `;
    console.log(`  + Admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  · Admin already exists: ${adminEmail}`);
  }

  console.log("\n✓ Setup complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Setup failed:", err);
  process.exit(1);
});

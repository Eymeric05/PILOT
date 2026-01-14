import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts", // schema path
  out: "./drizzle", // output path
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
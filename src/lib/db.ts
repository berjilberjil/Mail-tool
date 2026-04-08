import * as schema from "./db-schema";

const connectionString = process.env.DATABASE_URL!;
const isNeon = connectionString.includes("neon.tech");

// Use Neon HTTP driver for production (Vercel), postgres.js for local dev
const makeDb = () => {
  if (isNeon) {
    // Dynamic import to avoid bundling both drivers
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    return drizzle(neon(connectionString), { schema });
  } else {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    return drizzle(postgres(connectionString), { schema });
  }
};

export const db = makeDb();

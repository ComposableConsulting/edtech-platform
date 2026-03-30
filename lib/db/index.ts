import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as relations from "./relations";

// Lazy-initialize so neon() is never called at module load time.
// Cloudflare Pages build runs route modules without env vars set,
// and neon() throws immediately if DATABASE_URL is missing.
let _db: ReturnType<typeof drizzle> | undefined;

function getDb() {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL!), {
      schema: { ...schema, ...relations },
    });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
}) as ReturnType<typeof getDb>;

export type DB = typeof db;

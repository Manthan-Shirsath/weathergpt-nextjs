import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let dbInstance: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is missing in environment variables");
    }
    
    // Supabase transaction pooler (PgBouncer) requires prepare: false 
    // because prepared statements cannot be shared across different connections in transaction mode.
    const client = postgres(connectionString, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

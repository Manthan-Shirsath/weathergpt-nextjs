import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  await sql`
    CREATE TABLE IF NOT EXISTS official_alerts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      external_id text NOT NULL UNIQUE,
      source text NOT NULL,
      event text NOT NULL,
      severity text NOT NULL,
      urgency text,
      certainty text,
      headline text,
      description text,
      instruction text,
      areas jsonb NOT NULL,
      effective_at timestamp,
      expires_at timestamp,
      source_url text,
      updated_at timestamp DEFAULT now() NOT NULL,
      fetched_at timestamp DEFAULT now() NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS monitors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      location text NOT NULL,
      condition_type text NOT NULL,
      threshold jsonb,
      is_active boolean DEFAULT true NOT NULL,
      last_checked_at timestamp,
      last_triggered_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS monitor_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      monitor_id uuid NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
      event_type text NOT NULL,
      event_payload jsonb,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `;

  console.log("Tables created successfully.");
  await sql.end();
}

run().catch(console.error);

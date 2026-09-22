import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id).notNull(),
  role: text('role').notNull(),
  content: text('content'),
  toolCalls: jsonb('tool_calls'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  region: text('region').notNull(),
  severity: text('severity').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const officialAlerts = pgTable('official_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalId: text('external_id').notNull().unique(), // Stable IMD CAP identifier
  source: text('source').notNull(),
  event: text('event').notNull(),
  severity: text('severity').notNull(),
  urgency: text('urgency'),
  certainty: text('certainty'),
  headline: text('headline'),
  description: text('description'),
  instruction: text('instruction'),
  areas: jsonb('areas').notNull(), // string[]
  effectiveAt: timestamp('effective_at'),
  expiresAt: timestamp('expires_at'),
  sourceUrl: text('source_url'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const monitors = pgTable('monitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  location: text('location').notNull(),
  conditionType: text('condition_type').notNull(),
  threshold: jsonb('threshold'),
  isActive: boolean('is_active').default(true).notNull(),
  lastCheckedAt: timestamp('last_checked_at'),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monitorEvents = pgTable('monitor_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  monitorId: uuid('monitor_id').references(() => monitors.id).notNull(),
  eventType: text('event_type').notNull(),
  eventPayload: jsonb('event_payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

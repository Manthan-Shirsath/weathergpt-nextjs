import { z } from 'zod';

export const AlertSchema = z.object({
  id: z.string(), // Internal UUID
  externalId: z.string(), // Stable external ID from source
  source: z.string(), // e.g. "IMD"
  event: z.string(), // e.g. "Heavy Rain"
  severity: z.enum(['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown']),
  urgency: z.string().optional().nullable(),
  certainty: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  instruction: z.string().optional().nullable(),
  areas: z.array(z.string()),
  effectiveAt: z.string().optional().nullable(), // ISO String
  expiresAt: z.string().optional().nullable(), // ISO String
  sourceUrl: z.string().url().optional().nullable(),
  locationMatchLevel: z.enum(['exact', 'regional', 'state', 'unknown']).optional(),
  fetchedAt: z.string(), // ISO String
  updatedAt: z.string(), // ISO String
});

export type Alert = z.infer<typeof AlertSchema>;

export const ActiveAlertsResponseSchema = z.object({
  status: z.enum(['ready', 'no_official_alerts', 'unavailable', 'stale']),
  alerts: z.array(AlertSchema),
  reason: z.string().optional(),
  fetchedAt: z.string().optional(),
});

export type ActiveAlertsResponse = z.infer<typeof ActiveAlertsResponseSchema>;

import { z } from 'zod';

export const ConditionTypeSchema = z.enum([
  'temp_exceeds',
  'rain_probability_exceeds',
  'wind_exceeds',
  'official_alert'
]);

export const MonitorSchema = z.object({
  id: z.string(),
  location: z.string(),
  conditionType: ConditionTypeSchema,
  threshold: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean(),
  lastCheckedAt: z.string().optional().nullable(),
  lastTriggeredAt: z.string().optional().nullable(),
});

export type Monitor = z.infer<typeof MonitorSchema>;

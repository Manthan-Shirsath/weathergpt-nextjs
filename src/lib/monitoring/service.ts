import { getDb } from '../../db';
import { monitors, monitorEvents } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { weatherService } from '../weather/service';
import { AlertService } from '../alerts/service';

export class MonitoringService {
  /**
   * Evaluates all active monitors and creates events if conditions are met.
   * Designed to be idempotent - will not trigger repeatedly for the same condition if already triggered recently.
   */
  public static async evaluateMonitors(): Promise<void> {
    const activeMonitors = await getDb().select().from(monitors).where(eq(monitors.isActive, true));

    for (const monitor of activeMonitors) {
      let shouldTrigger = false;
      let payload: Record<string, unknown> = {};

      try {
        if (monitor.conditionType === 'official_alert') {
          const alertsRes = await AlertService.getActiveAlerts(monitor.location);
          if (alertsRes.status === 'ready' && alertsRes.alerts.length > 0) {
            // Find if there is a new alert since last trigger
            const latestAlert = alertsRes.alerts[0]; // Simplification for now, we just take the first
            shouldTrigger = true;
            payload = { alert_id: latestAlert.externalId, severity: latestAlert.severity, event: latestAlert.event };
          }
        } else {
          // Weather conditions
          const forecast = await weatherService.getWeatherForCity(monitor.location);
          if (forecast && forecast.current) {
            const thresholdObj = monitor.threshold as Record<string, unknown> | null;
            const thresholdValue = typeof thresholdObj?.value === 'number' ? thresholdObj.value : undefined;
            if (thresholdValue !== undefined) {
              switch (monitor.conditionType) {
                case 'temp_exceeds':
                  if (forecast.current.temperature_c > thresholdValue) {
                    shouldTrigger = true;
                    payload = { current_temp: forecast.current.temperature_c, threshold: thresholdValue };
                  }
                  break;
                case 'wind_exceeds':
                  if (forecast.current.wind_speed_kmh > thresholdValue) {
                    shouldTrigger = true;
                    payload = { current_wind: forecast.current.wind_speed_kmh, threshold: thresholdValue };
                  }
                  break;
                case 'rain_prob_exceeds':
                  if (forecast.current.precipitation_probability > thresholdValue) {
                    shouldTrigger = true;
                    payload = { rain_prob: forecast.current.precipitation_probability, threshold: thresholdValue };
                  }
                  break;
              }
            }
          }
        }

        const now = new Date();
        
        // Idempotency: Don't trigger if it was already triggered in the last 6 hours
        // A robust system would check if the exact event_payload changed, or if it recovered in between.
        let isIdempotentSkip = false;
        if (shouldTrigger && monitor.lastTriggeredAt) {
           const hoursSinceTrigger = (now.getTime() - new Date(monitor.lastTriggeredAt).getTime()) / (1000 * 60 * 60);
           if (hoursSinceTrigger < 6) {
             isIdempotentSkip = true;
           }
        }

        if (shouldTrigger && !isIdempotentSkip) {
          // 1. Create Event
          await getDb().insert(monitorEvents).values({
            monitorId: monitor.id,
            eventType: 'condition_met',
            eventPayload: payload,
            createdAt: now,
          });

          // 2. Update Monitor
          await getDb().update(monitors).set({
            lastTriggeredAt: now,
            lastCheckedAt: now,
            updatedAt: now,
          }).where(eq(monitors.id, monitor.id));
        } else {
           // Just update checked time
           await getDb().update(monitors).set({
            lastCheckedAt: now,
            updatedAt: now,
          }).where(eq(monitors.id, monitor.id));
        }

      } catch (error) {
        console.error(`[MonitoringService] Error evaluating monitor ${monitor.id}:`, error);
      }
    }
  }
}

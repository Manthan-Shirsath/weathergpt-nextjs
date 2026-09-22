import { Alert } from '../schema';

export interface AlertProvider {
  /**
   * Fetches alerts from the underlying provider, parsing and returning them
   * in the canonical Alert format (without internal UUIDs which the Service assigns).
   */
  fetchAlerts(): Promise<Omit<Alert, 'id' | 'locationMatchLevel' | 'fetchedAt' | 'updatedAt'>[]>;
}

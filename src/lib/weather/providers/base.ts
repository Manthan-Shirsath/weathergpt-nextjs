import { CanonicalWeatherDataset } from "../schema";

export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface BaseWeatherProvider {
  /** The unique string identifying this provider (e.g., 'open_meteo') */
  readonly providerName: string;

  /**
   * Resolve a city name to geographical coordinates and naming metadata.
   */
  geocodeCity(cityName: string): Promise<GeoLocation | null>;

  /**
   * Fetch a complete forecast for the given coordinates and normalize it.
   */
  fetchForecast(
    lat: number,
    lon: number,
    locationMeta: GeoLocation
  ): Promise<CanonicalWeatherDataset>;
}

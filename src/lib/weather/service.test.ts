import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WeatherService } from "./service";
import { redis } from "../redis";
import { BaseWeatherProvider, GeoLocation } from "./providers/base";
import { CanonicalWeatherDataset } from "./schema";
import { OpenMeteoProvider } from "./providers/open-meteo";

// Mock Upstash Redis
vi.mock("../redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Dummy valid dataset
const dummyDataset: CanonicalWeatherDataset = {
  location: {
    city: "TestCity",
    display_location: "TestCity, TestCountry",
    region: "TestRegion",
    country: "TestCountry",
    latitude: 10,
    longitude: 20,
  },
  current: {
    temperature_c: 25,
    feels_like_c: 26,
    humidity_pct: 60,
    precipitation_mm: 0,
    rain_mm: 0,
    precipitation_probability: 20,
    rain_probability_pct: 20,
    wind_speed_kmh: 10,
    wind_direction_deg: 180,
    wind_direction_label: "S",
    wind_gusts_kmh: 15,
    cloud_cover_pct: 40,
    pressure_hpa: 1013,
    visibility_km: 10,
    uv_index: 5,
    weather_code: 0,
    condition: "Sunny",
    icon: "sun",
  },
  hourly: [],
  daily: [],
  freshness: {
    provider: "test_provider",
    nwp_source: "gfs_seamless",
    nwp_model: "NOAA GFS",
    fetched_at: new Date().toISOString(),
    observed_at: new Date().toISOString(),
    stale: false,
    ttl_seconds: 900,
  },
};

// Mock Provider
class MockProvider implements BaseWeatherProvider {
  providerName = "test_provider";
  async geocodeCity(city: string) {
    if (city === "InvalidCity") return null;
    return { name: city, latitude: 10, longitude: 20 };
  }
  async fetchForecast(_lat: number, _lon: number, _geo: GeoLocation) {
    if (_lat === 999) throw new Error("Upstream failed");
    return { ...dummyDataset, location: { ...dummyDataset.location, city: _geo.name } };
  }
}

describe("WeatherService", () => {
  let service: WeatherService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WeatherService(new MockProvider());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cache hit if fresh", async () => {
    const freshDataset = JSON.parse(JSON.stringify(dummyDataset));
    freshDataset.freshness.fetched_at = new Date().toISOString();

    vi.mocked(redis!.get).mockResolvedValue(freshDataset);

    const result = await service.getWeatherForCity("TestCity");
    
    expect(redis!.get).toHaveBeenCalledWith("weather:city:testcity");
    expect(result.freshness.stale).toBe(false);
    expect(result.current.temperature_c).toBe(25);
  });

  it("should ignore cache and fetch new if stale cache but provider succeeds", async () => {
    const staleDataset = JSON.parse(JSON.stringify(dummyDataset));
    staleDataset.freshness.fetched_at = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hr ago

    vi.mocked(redis!.get).mockResolvedValue(staleDataset);
    vi.mocked(redis!.set).mockResolvedValue("OK");

    const result = await service.getWeatherForCity("TestCity");
    
    expect(redis!.get).toHaveBeenCalledWith("weather:city:testcity");
    expect(redis!.set).toHaveBeenCalled(); // Should cache the new result
    expect(result.freshness.stale).toBe(false);
  });

  it("should fallback to stale cache if provider fails", async () => {
    const staleDataset = JSON.parse(JSON.stringify(dummyDataset));
    staleDataset.freshness.fetched_at = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hr ago

    // Provide a mocked provider that fails on fetch
    class FailingProvider extends MockProvider {
      async fetchForecast(): Promise<CanonicalWeatherDataset> {
        throw new Error("API Down");
      }
    }
    const failingService = new WeatherService(new FailingProvider());

    vi.mocked(redis!.get).mockResolvedValue(staleDataset);

    const result = await failingService.getWeatherForCity("TestCity");
    
    expect(result.freshness.stale).toBe(true);
  });

  it("should throw if provider fails and no cache exists", async () => {
    class FailingProvider extends MockProvider {
      async fetchForecast(): Promise<CanonicalWeatherDataset> {
        throw new Error("API Down");
      }
    }
    const failingService = new WeatherService(new FailingProvider());
    vi.mocked(redis!.get).mockResolvedValue(null);

    await expect(failingService.getWeatherForCity("TestCity")).rejects.toThrow("API Down");
  });

  it("should throw if city is invalid", async () => {
    await expect(service.getWeatherForCity("InvalidCity")).rejects.toThrow("Location 'InvalidCity' not found");
  });
});

describe("OpenMeteoProvider Normalization", () => {
  it("should handle UTC timestamps and correct unit normalization", async () => {
    const provider = new OpenMeteoProvider();
    
    const mockGeo: GeoLocation = { name: "London", latitude: 51.5, longitude: -0.1, country: "UK" };
    const mockRawResponse = {
      current: {
        time: "2026-09-12T10:00:00Z",
        temperature_2m: 15,
        weather_code: 3,
      },
      hourly: {
        time: ["2026-09-12T10:00:00Z"],
        temperature_2m: [15],
      },
      daily: {
        time: ["2026-09-12"],
        temperature_2m_max: [20],
        temperature_2m_min: [10],
      }
    };

    // Use any because private method access for unit testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataset = (provider as any).normalize(mockRawResponse, mockGeo);

    expect(dataset.location.city).toBe("London");
    expect(dataset.current.temperature_c).toBe(15);
    expect(dataset.current.condition).toBe("Cloudy");
    expect(dataset.daily[0].high_c).toBe(20);
    // Ensure freshness metadata defaults properly
    expect(dataset.freshness.nwp_source).toBe("gfs_seamless");
  });
});

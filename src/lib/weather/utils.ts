// WMO Weather Condition Map
const WMO_WEATHER_MAP: Record<number, [string, string]> = {
  0: ["Sunny", "sun"],
  1: ["Mainly Clear", "sun"],
  2: ["Partly Cloudy", "partly-cloudy"],
  3: ["Cloudy", "cloudy"],
  45: ["Foggy", "fog"],
  48: ["Depositing Rime Fog", "fog"],
  51: ["Light Drizzle", "rain"],
  53: ["Moderate Drizzle", "rain"],
  55: ["Dense Drizzle", "rain"],
  56: ["Light Freezing Drizzle", "rain"],
  57: ["Dense Freezing Drizzle", "rain"],
  59: ["Slight Rain", "rain"],
  61: ["Slight Rain", "rain"],
  63: ["Moderate Rain", "rain"],
  65: ["Heavy Rain", "rain"],
  66: ["Light Freezing Rain", "rain"],
  67: ["Heavy Freezing Rain", "rain"],
  71: ["Light Snow", "snow"],
  73: ["Moderate Snow", "snow"],
  75: ["Heavy Snow", "snow"],
  77: ["Snow Grains", "snow"],
  80: ["Scattered Rain", "rain"],
  81: ["Rain Showers", "rain"],
  82: ["Violent Rain Showers", "rain"],
  85: ["Light Snow Showers", "snow"],
  86: ["Heavy Snow Showers", "snow"],
  95: ["Thunderstorms", "thunderstorm"],
  96: ["Thunderstorm with Hail", "thunderstorm"],
  99: ["Heavy Thunderstorm with Hail", "thunderstorm"],
};

export function decodeWeatherCode(code?: number | null): [string, string] {
  if (code == null) {
    return ["Partly Cloudy", "partly-cloudy"];
  }
  return WMO_WEATHER_MAP[code] || ["Partly Cloudy", "partly-cloudy"];
}

export function getWindDirectionLabel(degrees?: number | null): string {
  if (degrees == null) {
    return "N";
  }
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const idx = Math.round(degrees / (360 / directions.length)) % directions.length;
  return directions[idx];
}

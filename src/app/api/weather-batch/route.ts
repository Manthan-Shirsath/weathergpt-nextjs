import { NextResponse } from 'next/server';
import { weatherService } from '@/lib/weather/service';

export const runtime = 'nodejs';

export const MAJOR_INDIAN_CITIES = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedCities = searchParams.get('cities');
    
    let targetList = MAJOR_INDIAN_CITIES;
    if (requestedCities) {
      const names = requestedCities.split(',').map(n => n.trim().toLowerCase());
      targetList = MAJOR_INDIAN_CITIES.filter(c => names.includes(c.name.toLowerCase()));
      if (targetList.length === 0) targetList = MAJOR_INDIAN_CITIES;
    }

    const results = await Promise.allSettled(
      targetList.map(async (city) => {
        const weather = await weatherService.getWeather(city.lat, city.lon, false, { name: city.name });
        return {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          temp: Math.round(weather.current.temperature_c),
          feels_like: Math.round(weather.current.feels_like_c),
          condition: weather.current.condition,
          humidity: weather.current.humidity_pct,
          wind_speed: Math.round(weather.current.wind_speed_kmh),
          icon: weather.current.icon,
        };
      })
    );

    const data = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    return NextResponse.json({
      success: true,
      cities: data,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      }
    });
  } catch (error: any) {
    console.error('Weather batch error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch batch weather' }, { status: 500 });
  }
}

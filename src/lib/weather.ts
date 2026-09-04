import type { WeatherForecastDay } from "../types";

/**
 * Fetches a 7-day forecast from Open-Meteo for the surveyed field's
 * centroid. Free tier, no API key. Fails soft — callers should treat a
 * null return as "weather unavailable" rather than a hard error, since
 * evaluation venues often have flaky WiFi.
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number
): Promise<WeatherForecastDay[] | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const data = await res.json();
    const days: WeatherForecastDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempMaxC: data.daily.temperature_2m_max[i],
      tempMinC: data.daily.temperature_2m_min[i],
      precipitationMm: data.daily.precipitation_sum[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      weatherCode: data.daily.weathercode[i],
    }));
    return days;
  } catch (e) {
    console.warn("fetchWeatherForecast failed, continuing offline:", e);
    return null;
  }
}

/** WMO weather code → short human label, used for compact forecast chips. */
export function weatherCodeLabel(code: number): string {
  const map: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent showers",
    95: "Thunderstorm",
  };
  return map[code] ?? "—";
}

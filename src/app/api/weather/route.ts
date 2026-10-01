import type { NextRequest } from "next/server";
import type {
  ErrorResponse,
  ForecastItem,
  WeatherResponse,
} from "@/types/weather";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// OpenWeatherMap から返ってくるデータのうち、使う部分だけの型
type GeoResult = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

type OwmForecast = {
  city: { timezone: number };
  list: {
    dt: number;
    main: { temp: number; humidity: number };
    weather: { description: string; icon: string }[];
    pop: number;
  }[];
};

function errorJson(message: string, status: number) {
  const body: ErrorResponse = { error: message };
  return Response.json(body, { status });
}

// GET /api/weather?city=Tokyo
export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim();
  if (!city) {
    return errorJson("都市名を入力してください。", 400);
  }

  // APIキーはサーバー側でのみ読み込む（ブラウザには送らない）
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("OPENWEATHER_API_KEY が設定されていません");
    return errorJson("サーバーの設定に問題があります。", 500);
  }

  try {
    // 1. Geocoding API: 都市名 → 緯度・経度
    const geoUrl = new URL(GEO_URL);
    geoUrl.search = new URLSearchParams({
      q: city,
      limit: "1",
      appid: apiKey,
    }).toString();

    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      // URL にはキーが含まれるため、ログにはステータスだけを出す
      console.error(`Geocoding API エラー: status ${geoRes.status}`);
      return errorJson("天気情報の取得に失敗しました。", 502);
    }

    const geoData = (await geoRes.json()) as GeoResult[];
    const place = geoData[0];
    if (!place) {
      return errorJson(`「${city}」が見つかりませんでした。`, 404);
    }

    // 2. 5 Day / 3 Hour Forecast API: 緯度・経度 → 予報
    const forecastUrl = new URL(FORECAST_URL);
    forecastUrl.search = new URLSearchParams({
      lat: String(place.lat),
      lon: String(place.lon),
      units: "metric",
      lang: "ja",
      appid: apiKey,
    }).toString();

    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) {
      console.error(`Forecast API エラー: status ${forecastRes.status}`);
      return errorJson("天気情報の取得に失敗しました。", 502);
    }

    const forecastData = (await forecastRes.json()) as OwmForecast;
    const timezone = forecastData.city.timezone;

    const forecasts: ForecastItem[] = forecastData.list.map((item) => {
      // UTC の時刻に時差を足し、ISO 形式から現地の日付・時刻を取り出す
      const local = new Date((item.dt + timezone) * 1000).toISOString();
      return {
        dt: item.dt,
        localDate: local.slice(0, 10),
        localTime: local.slice(11, 16),
        temp: item.main.temp,
        description: item.weather[0]?.description ?? "",
        icon: item.weather[0]?.icon ?? "",
        humidity: item.main.humidity,
        pop: Math.round(item.pop * 100),
      };
    });

    const body: WeatherResponse = {
      city: {
        // 日本語名があれば日本語で表示する
        name: place.local_names?.ja ?? place.name,
        country: place.country,
        state: place.state,
        timezone,
      },
      forecasts,
    };
    return Response.json(body);
  } catch {
    // エラー内容に URL（キー入り）が含まれる可能性があるため、詳細は出さない
    console.error("OpenWeatherMap への接続に失敗しました");
    return errorJson("天気情報の取得に失敗しました。", 502);
  }
}

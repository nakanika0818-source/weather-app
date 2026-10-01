import Image from "next/image";
import type { ForecastItem, WeatherResponse } from "@/types/weather";

type Props = {
  city: WeatherResponse["city"];
  forecast: ForecastItem;
};

// UNIX 秒 + 時差（秒）から、現地時刻の文字列を作る
function formatLocalTime(dt: number, timezone: number) {
  const date = new Date((dt + timezone) * 1000);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC", // 時差は上で足しているので UTC として表示する
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WeatherCard({ city, forecast }: Props) {
  const place = [city.state, city.country].filter(Boolean).join(", ");

  return (
    <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-2xl font-bold">{city.name}</h2>
        {place && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{place}</p>
        )}
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {formatLocalTime(forecast.dt, city.timezone)}（現地時間）の予報
        </p>
      </header>

      <div className="mb-6 flex items-center gap-4">
        {forecast.icon && (
          <Image
            src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`}
            alt={forecast.description}
            width={80}
            height={80}
            className="rounded-full bg-sky-100 dark:bg-sky-950"
          />
        )}
        <div>
          <p className="text-5xl font-bold">{Math.round(forecast.temp)}℃</p>
          <p className="mt-1 text-lg">{forecast.description}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">湿度</dt>
          <dd className="text-2xl font-semibold">{forecast.humidity}%</dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">降水確率</dt>
          <dd className="text-2xl font-semibold">{forecast.pop}%</dd>
        </div>
      </dl>
    </section>
  );
}

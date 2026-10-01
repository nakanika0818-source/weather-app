import Image from "next/image";
import type { ForecastItem } from "@/types/weather";

type Props = {
  /** 表示する日付（YYYY-MM-DD、現地時間） */
  date: string;
  /** その日の 3 時間ごとの予報 */
  forecasts: ForecastItem[];
};

// "2026-10-01" → "10月1日(木)"
function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC", // 日付文字列をそのまま表示したいので UTC として扱う
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function HourlyList({ date, forecasts }: Props) {
  return (
    <section>
      <h3 className="mb-3 text-lg font-bold">
        {formatDate(date)} の3時間ごとの予報
      </h3>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {forecasts.map((f) => (
          <li key={f.dt} className="flex items-center gap-3 px-4 py-3">
            <span className="w-12 shrink-0 font-mono font-semibold">{f.localTime}</span>
            {f.icon && (
              <Image
                src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                alt=""
                width={40}
                height={40}
                className="shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className="truncate">{f.description}</span>
                <span className="text-lg font-semibold">{Math.round(f.temp)}℃</span>
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                湿度 {f.humidity}% ・ 降水確率 {f.pop}%
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import Image from "next/image";
import { toUnixSeconds } from "@/lib/commute";
import { formatDate, formatPrecipitation } from "@/lib/format";
import type { ForecastItem } from "@/types/weather";

type Props = {
  /** 対象の日付（YYYY-MM-DD、現地時間）。画面で選択している日付 */
  date: string;
  /** UTC からの時差（秒） */
  timezone: number;
  departTime: string;
  returnTime: string;
  /** 出勤・帰宅の時刻に最も近い予報（findNearestForecast の結果）。なければ undefined */
  departForecast: ForecastItem | undefined;
  returnForecast: ForecastItem | undefined;
  onDepartTimeChange: (time: string) => void;
  onReturnTimeChange: (time: string) => void;
};

// 予報の時刻と入力した時刻の差を「1時間30分後」のような文字列にする
function formatGap(seconds: number) {
  const minutes = Math.round(Math.abs(seconds) / 60);
  if (minutes === 0) return "入力と同じ時刻";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const text = `${h > 0 ? `${h}時間` : ""}${m > 0 ? `${m}分` : ""}`;
  return `入力の${text}${seconds > 0 ? "後" : "前"}`;
}

type SlotProps = {
  id: string;
  label: string;
  date: string;
  time: string;
  forecast: ForecastItem | undefined;
  timezone: number;
  onTimeChange: (time: string) => void;
};

function CommuteSlot({ id, label, date, time, forecast, timezone, onTimeChange }: SlotProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <input
          id={id}
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus:ring-sky-900"
        />
      </div>

      {!time ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">時刻を入力してください。</p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">入力した日時</dt>
            <dd>
              {formatDate(date)} {time}
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">使用した予報</dt>
            <dd>
              {forecast ? (
                <>
                  {formatDate(forecast.localDate)} {forecast.localTime}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    （{formatGap(forecast.dt - toUnixSeconds(date, time, timezone))}）
                  </span>
                </>
              ) : (
                "なし"
              )}
            </dd>
          </dl>

          {forecast ? (
            <div className="flex items-center gap-3">
              {forecast.icon && (
                <Image
                  src={`https://openweathermap.org/img/wn/${forecast.icon}.png`}
                  alt=""
                  width={40}
                  height={40}
                  className="shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{forecast.description}</span>
                  <span className="text-lg font-semibold">{Math.round(forecast.temp)}℃</span>
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  降水確率 {forecast.pop}% ・ 降水量（3時間） {formatPrecipitation(forecast.precipitation)}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              この時刻の前後1時間30分以内に予報がありません（予報の範囲外です）。
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function CommuteForecast({
  date,
  timezone,
  departTime,
  returnTime,
  departForecast,
  returnForecast,
  onDepartTimeChange,
  onReturnTimeChange,
}: Props) {
  return (
    <section>
      <h3 className="mb-1 text-lg font-bold">出勤・帰宅時刻に近い予報</h3>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        予報は3時間ごとのため、入力した時刻に最も近い予報を表示します（現地時間）。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <CommuteSlot
          id="depart-time"
          label="出勤"
          date={date}
          time={departTime}
          forecast={departForecast}
          timezone={timezone}
          onTimeChange={onDepartTimeChange}
        />
        <CommuteSlot
          id="return-time"
          label="帰宅"
          date={date}
          time={returnTime}
          forecast={returnForecast}
          timezone={timezone}
          onTimeChange={onReturnTimeChange}
        />
      </div>
    </section>
  );
}

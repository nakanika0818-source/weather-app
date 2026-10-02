import type { ForecastItem } from "@/types/weather";

/**
 * 「近い予報」とみなす最大の時間差（秒）。
 * 予報は 3 時間ごとなので、その半分の 1 時間 30 分までなら必ずどれかの予報に当たる。
 * これより離れている場合（予報の範囲外の日時）は「該当なし」とする。
 */
export const MAX_GAP_SECONDS = 90 * 60;

/** 都市の現地日付（YYYY-MM-DD）と現地時刻（HH:mm）を UNIX 秒（UTC）に変換する */
export function toUnixSeconds(date: string, time: string, timezone: number) {
  return Date.parse(`${date}T${time}:00Z`) / 1000 - timezone;
}

/**
 * 指定した現地日時に最も近い予報を探す。見つからなければ undefined。
 * 2 つの予報からちょうど同じ距離のときは、早い方の予報を使う。
 */
export function findNearestForecast(
  forecasts: ForecastItem[],
  date: string,
  time: string,
  timezone: number,
) {
  const target = toUnixSeconds(date, time, timezone);
  let nearest: ForecastItem | undefined;
  let minGap = Infinity;
  for (const f of forecasts) {
    const gap = Math.abs(f.dt - target);
    if (gap < minGap) {
      nearest = f;
      minGap = gap;
    }
  }
  return minGap <= MAX_GAP_SECONDS ? nearest : undefined;
}

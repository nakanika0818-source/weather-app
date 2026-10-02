// "2026-10-01" → "10月1日(木)"
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC", // 日付文字列をそのまま表示したいので UTC として扱う
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}

// UTC からの時差（秒）→ "UTC+9"、"UTC+5:30"、"UTC-4"
export function formatUtcOffset(timezone: number) {
  const sign = timezone < 0 ? "-" : "+";
  const minutes = Math.abs(timezone) / 60;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `UTC${sign}${h}${m > 0 ? `:${String(m).padStart(2, "0")}` : ""}`;
}

// 降水量（mm）を表示用の文字列にする。わずかな量を「0mm」と見せないようにする
export function formatPrecipitation(mm: number) {
  if (mm <= 0) return "0mm";
  if (mm < 0.1) return "0.1mm未満";
  return `${Math.round(mm * 10) / 10}mm`;
}

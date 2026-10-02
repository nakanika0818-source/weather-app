// ブラウザから自分のサーバーの API Route を呼ぶ処理（APIキーはサーバー側だけで扱う）
import type { ErrorResponse, WeatherResponse } from "@/types/weather";

export type FetchWeatherResult =
  | { ok: true; data: WeatherResponse }
  | { ok: false; kind: "notFound" | "error"; message: string };

export function isAbortError(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

/**
 * 都市名で天気予報を取得する。失敗は例外ではなく結果として返す。
 * ただし AbortController で取り消された場合だけは、呼び出し側で無視できるよう例外のまま投げる。
 */
export async function fetchWeather(
  city: string,
  signal?: AbortSignal,
): Promise<FetchWeatherResult> {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, { signal });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ErrorResponse | null;
      const message = body?.error ?? "天気情報の取得に失敗しました。";
      return { ok: false, kind: res.status === 404 ? "notFound" : "error", message };
    }

    return { ok: true, data: (await res.json()) as WeatherResponse };
  } catch (e) {
    if (isAbortError(e)) throw e;
    return {
      ok: false,
      kind: "error",
      message: "通信に失敗しました。ネットワーク接続を確認してください。",
    };
  }
}

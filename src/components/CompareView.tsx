"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { findCommonDts, getTempDiff } from "@/lib/compare";
import { roundTemp } from "@/lib/clothing";
import { fetchWeather, isAbortError, type FetchWeatherResult } from "@/lib/fetchWeather";
import { formatDate, formatPrecipitation, formatUtcOffset } from "@/lib/format";
import type { ForecastItem, WeatherResponse } from "@/types/weather";

/** 入力欄の表示名。メッセージでも「どちらの都市か」をこの名前で示す */
const CITY_LABELS = ["都市1", "都市2"] as const;
const PLACEHOLDERS = ["例: Tokyo（自宅）", "例: London（外出先）"];

type State =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      /** 検索した都市名（メッセージ用） */
      queries: [string, string];
      results: [FetchWeatherResult, FetchWeatherResult];
      /** 選択中の共通予報時刻（UNIX 秒）。共通の予報がなければ undefined */
      selectedDt: number | undefined;
    };

// 都市名 + 現地日時の 1 行表示（例: "東京都 10月3日(土) 09:00"）
function formatLocal(city: WeatherResponse["city"], f: ForecastItem) {
  return `${city.name} ${formatDate(f.localDate)} ${f.localTime}`;
}

function CompareCard({
  label,
  city,
  forecast,
}: {
  label: string;
  city: WeatherResponse["city"];
  forecast: ForecastItem;
}) {
  const place = [city.state, city.country].filter(Boolean).join(", ");

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <h3 className="text-xl font-bold">{city.name}</h3>
        {place && <p className="text-sm text-zinc-500 dark:text-zinc-400">{place}</p>}
        <p className="mt-1 text-sm">
          {formatDate(forecast.localDate)} {forecast.localTime}
          <span className="text-zinc-500 dark:text-zinc-400">
            （現地時間・{formatUtcOffset(city.timezone)}）
          </span>
        </p>
      </header>

      <div className="flex items-center gap-3">
        {forecast.icon && (
          <Image
            src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`}
            alt=""
            width={64}
            height={64}
            className="rounded-full bg-sky-100 dark:bg-sky-950"
          />
        )}
        <div>
          <p className="text-4xl font-bold">{roundTemp(forecast.temp)}℃</p>
          <p>{forecast.description}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">降水確率</dt>
          <dd className="text-xl font-semibold">{forecast.pop}%</dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <dt className="text-sm text-zinc-500 dark:text-zinc-400">降水量（3時間）</dt>
          <dd className="text-xl font-semibold">{formatPrecipitation(forecast.precipitation)}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function CompareView() {
  const [cities, setCities] = useState<[string, string]>(["", ""]);
  // 未入力の欄（検索ボタンを押したときに判定する）
  const [emptyLabels, setEmptyLabels] = useState<string[]>([]);
  const [state, setState] = useState<State>({ status: "idle" });
  // 連続で検索したとき、前のリクエストを取り消すため
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const queries: [string, string] = [cities[0].trim(), cities[1].trim()];
    const empty = CITY_LABELS.filter((_, i) => !queries[i]);
    setEmptyLabels(empty);
    if (empty.length > 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading" });

    try {
      // 2 都市を同時に取得する。片方が失敗しても、もう片方の結果は残す
      const results = await Promise.all(
        queries.map((q) => fetchWeather(q, controller.signal)),
      );
      const pair: [FetchWeatherResult, FetchWeatherResult] = [results[0], results[1]];
      const common =
        pair[0].ok && pair[1].ok
          ? findCommonDts(pair[0].data.forecasts, pair[1].data.forecasts)
          : [];
      setState({ status: "done", queries, results: pair, selectedDt: common[0] });
    } catch (e) {
      // 新しい検索で取り消された古いリクエストは無視する
      if (isAbortError(e)) return;
      throw e;
    }
  };

  const handleDtChange = (dt: number) => {
    setState((prev) => (prev.status === "done" ? { ...prev, selectedDt: dt } : prev));
  };

  const done = state.status === "done" ? state : undefined;
  const [r1, r2] = done?.results ?? [];
  const bothOk = r1?.ok && r2?.ok ? ([r1.data, r2.data] as const) : undefined;
  const commonDts = bothOk ? findCommonDts(bothOk[0].forecasts, bothOk[1].forecasts) : [];
  const pick = (data: WeatherResponse) =>
    data.forecasts.find((f) => f.dt === done?.selectedDt);
  const f1 = bothOk && pick(bothOk[0]);
  const f2 = bothOk && pick(bothOk[1]);
  const tempDiff = f1 && f2 ? getTempDiff(f1, f2) : undefined;

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {CITY_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col gap-1">
              <label htmlFor={`compare-city-${i}`} className="text-sm font-semibold">
                {label}
              </label>
              <input
                id={`compare-city-${i}`}
                type="text"
                value={cities[i]}
                onChange={(e) => {
                  const next: [string, string] = [...cities];
                  next[i] = e.target.value;
                  setCities(next);
                }}
                placeholder={PLACEHOLDERS[i]}
                aria-invalid={emptyLabels.includes(label)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 aria-[invalid=true]:border-red-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-sky-900"
              />
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === "loading" ? "検索中…" : "2都市を比較"}
        </button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        {emptyLabels.length > 0 && (
          <p
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
          >
            {emptyLabels.join("と")}の都市名を入力してください。
          </p>
        )}

        {state.status === "loading" && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">読み込み中…</p>
        )}

        {/* 取得に失敗した都市を、どちらの欄か分かるように表示する */}
        {done &&
          done.results.map((r, i) =>
            r.ok ? null : (
              <p
                key={CITY_LABELS[i]}
                role="alert"
                className={
                  r.kind === "notFound"
                    ? "rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                    : "rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                }
              >
                <span className="font-semibold">
                  {CITY_LABELS[i]}（{done.queries[i]}）：
                </span>
                {r.message}
                {r.kind === "notFound" && (
                  <>
                    <br />
                    <span className="text-sm">
                      英語表記（例: Osaka, London）でも試してみてください。
                    </span>
                  </>
                )}
              </p>
            ),
          )}

        {done && !bothOk && done.results.some((r) => r.ok) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {done.results
              .map((r, i) => (r.ok ? `${CITY_LABELS[i]}（${r.data.city.name}）` : null))
              .filter(Boolean)
              .join("")}
            は取得できました。もう一方の都市名を確認して、もう一度検索してください。
          </p>
        )}

        {bothOk && commonDts.length === 0 && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            2都市で共通する予報日時がありませんでした。
          </p>
        )}
      </div>

      {bothOk && f1 && f2 && done?.selectedDt !== undefined && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="compare-dt" className="font-semibold">
              比較する予報日時
            </label>
            <select
              id="compare-dt"
              value={done.selectedDt}
              onChange={(e) => handleDtChange(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus:ring-sky-900"
            >
              {commonDts.map((dt) => {
                const a = bothOk[0].forecasts.find((f) => f.dt === dt)!;
                const b = bothOk[1].forecasts.find((f) => f.dt === dt)!;
                return (
                  <option key={dt} value={dt}>
                    {formatLocal(bothOk[0].city, a)} ／ {formatLocal(bothOk[1].city, b)}
                  </option>
                );
              })}
            </select>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              2都市の同じ瞬間の予報を比べます（3時間ごと）。時差があるため、現地の日時は都市ごとに異なります。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CompareCard label={CITY_LABELS[0]} city={bothOk[0].city} forecast={f1} />
            <CompareCard label={CITY_LABELS[1]} city={bothOk[1].city} forecast={f2} />
          </div>

          <p className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">気温差</span>
            <br />
            {tempDiff === 0 ? (
              <span className="text-lg font-semibold">2都市は同じ気温です</span>
            ) : (
              <span className="text-lg font-semibold">
                {bothOk[1].city.name}は{bothOk[0].city.name}より
                {Math.abs(tempDiff!)}℃{tempDiff! > 0 ? "高い" : "低い"}
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}

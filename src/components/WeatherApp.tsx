"use client";

import { useMemo, useRef, useState } from "react";
import ClothingAdvice from "@/components/ClothingAdvice";
import CommuteForecast from "@/components/CommuteForecast";
import DatePicker from "@/components/DatePicker";
import HourlyList from "@/components/HourlyList";
import SearchForm from "@/components/SearchForm";
import WeatherCard from "@/components/WeatherCard";
import { findNearestForecast } from "@/lib/commute";
import { fetchWeather, isAbortError } from "@/lib/fetchWeather";
import type { ForecastItem, WeatherResponse } from "@/types/weather";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: WeatherResponse; selectedDate: string }
  | { status: "notFound"; message: string }
  | { status: "error"; message: string };

// 予報を現地日付ごとにまとめる（Map は追加順を保つので日付は昇順のまま）
function groupByDate(forecasts: ForecastItem[]) {
  const groups = new Map<string, ForecastItem[]>();
  for (const f of forecasts) {
    const list = groups.get(f.localDate) ?? [];
    list.push(f);
    groups.set(f.localDate, list);
  }
  return groups;
}

export default function WeatherApp() {
  const [state, setState] = useState<State>({ status: "idle" });
  // 出勤・帰宅の時刻（HH:mm、現地時間）。都市を検索し直しても保つ
  const [departTime, setDepartTime] = useState("08:00");
  const [returnTime, setReturnTime] = useState("18:00");
  // 連続で検索したとき、前のリクエストを取り消すため
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async (city: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    try {
      const result = await fetchWeather(city, controller.signal);

      if (!result.ok) {
        setState(
          result.kind === "notFound"
            ? { status: "notFound", message: result.message }
            : { status: "error", message: result.message },
        );
        return;
      }

      // 都市を検索し直したら、選択日はその都市の予報がある最初の日に戻す
      setState({
        status: "success",
        data: result.data,
        selectedDate: result.data.forecasts[0]?.localDate ?? "",
      });
    } catch (e) {
      // 新しい検索で取り消された古いリクエストは無視する
      if (isAbortError(e)) return;
      throw e;
    }
  };

  // 日付の切り替えは取得済みデータの中で行う（API は呼ばない）
  const handleDateChange = (date: string) => {
    setState((prev) =>
      prev.status === "success" ? { ...prev, selectedDate: date } : prev,
    );
  };

  const forecasts = state.status === "success" ? state.data.forecasts : undefined;
  const groups = useMemo(() => groupByDate(forecasts ?? []), [forecasts]);
  const availableDates = [...groups.keys()];
  const latest = forecasts?.[0];

  // 出勤・帰宅の時刻に最も近い予報。出勤・帰宅予報と服装の目安の両方で同じものを使う
  const findCommuteForecast = (time: string) =>
    state.status === "success" && time
      ? findNearestForecast(
          state.data.forecasts,
          state.selectedDate,
          time,
          state.data.city.timezone,
        )
      : undefined;
  const departForecast = findCommuteForecast(departTime);
  const returnForecast = findCommuteForecast(returnTime);

  return (
    <div className="flex w-full flex-col gap-6">
      <SearchForm onSearch={handleSearch} isLoading={state.status === "loading"} />

      <div aria-live="polite">
        {state.status === "loading" && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">読み込み中…</p>
        )}

        {state.status === "notFound" && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {state.message}
            <br />
            <span className="text-sm">
              英語表記（例: Osaka, London）でも試してみてください。
            </span>
          </p>
        )}

        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {state.message}
          </p>
        )}

        {state.status === "success" && !latest && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            予報データがありませんでした。
          </p>
        )}
      </div>

      {state.status === "success" && latest && (
        <>
          <WeatherCard city={state.data.city} forecast={latest} />
          <DatePicker
            availableDates={availableDates}
            selectedDate={state.selectedDate}
            onChange={handleDateChange}
          />
          <CommuteForecast
            date={state.selectedDate}
            timezone={state.data.city.timezone}
            departTime={departTime}
            returnTime={returnTime}
            departForecast={departForecast}
            returnForecast={returnForecast}
            onDepartTimeChange={setDepartTime}
            onReturnTimeChange={setReturnTime}
          />
          <ClothingAdvice departForecast={departForecast} returnForecast={returnForecast} />
          <HourlyList
            date={state.selectedDate}
            forecasts={groups.get(state.selectedDate) ?? []}
          />
        </>
      )}
    </div>
  );
}

import {
  CLOTHING_LEVELS,
  LAYERING_TEMP_DIFF,
  UMBRELLA_POP,
  getClothingAdvice,
  roundTemp,
} from "@/lib/clothing";
import { formatDate } from "@/lib/format";
import type { ForecastItem } from "@/types/weather";

type Props = {
  /** 出勤・帰宅の「使用した予報」。予報がない場合は undefined */
  departForecast: ForecastItem | undefined;
  returnForecast: ForecastItem | undefined;
};

// 区切りの表から「20〜24℃」のような範囲の文字列を作る
function formatRange(index: number) {
  const min = CLOTHING_LEVELS[index].minTemp;
  const upper = index > 0 ? CLOTHING_LEVELS[index - 1].minTemp - 1 : undefined;
  if (!Number.isFinite(min)) return `${upper}℃以下`;
  if (upper === undefined) return `${min}℃以上`;
  return `${min}〜${upper}℃`;
}

export default function ClothingAdvice({ departForecast, returnForecast }: Props) {
  const advice = getClothingAdvice([
    { label: "出勤", forecast: departForecast },
    { label: "帰宅", forecast: returnForecast },
  ]);

  return (
    <section>
      <h3 className="mb-1 text-lg font-bold">服装の目安</h3>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        出勤・帰宅の「使用した予報」の気温をもとにしています。
      </p>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <ul className="grid gap-3 sm:grid-cols-2">
          {advice.slots.map(({ label, forecast, level }) => (
            <li key={label} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-sm font-semibold">{label}</p>
              {forecast && level ? (
                <>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(forecast.localDate)} {forecast.localTime} の予報・
                    {roundTemp(forecast.temp)}℃
                  </p>
                  <p className="mt-1 text-lg font-bold">{level.label}</p>
                  <p className="text-sm">{level.detail}</p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  使用できる予報がないため、服装の目安は判定していません。
                </p>
              )}
            </li>
          ))}
        </ul>

        {(advice.layeringTempDiff !== undefined || advice.umbrellaSlots.length > 0) && (
          <ul className="flex flex-col gap-2 text-sm">
            {advice.layeringTempDiff !== undefined && (
              <li className="rounded-lg bg-sky-50 p-3 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                出勤と帰宅の気温差が{advice.layeringTempDiff}℃あります。脱ぎ着できる重ね着がおすすめです。
              </li>
            )}
            {advice.umbrellaSlots.length > 0 && (
              <li className="rounded-lg bg-sky-50 p-3 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
                {advice.umbrellaSlots.join("・")}の時間帯に雨や雪の予報があります。傘があると安心です。
              </li>
            )}
          </ul>
        )}

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          服装は目安です。寒さ・暑さの感じ方に合わせて調整してください。
        </p>

        <details className="text-sm text-zinc-600 dark:text-zinc-300">
          <summary className="cursor-pointer">判定の基準</summary>
          <ul className="mt-2 list-disc pl-5">
            {CLOTHING_LEVELS.map((level, i) => (
              <li key={level.label}>
                {formatRange(i)}：{level.label}
              </li>
            ))}
            <li>気温は四捨五入した値（画面の表示と同じ値）で判定します。</li>
            <li>出勤と帰宅の気温差が{LAYERING_TEMP_DIFF}℃以上：重ね着をおすすめ</li>
            <li>降水確率{UMBRELLA_POP}%以上、または降水量が0mmより多い：傘をおすすめ</li>
          </ul>
        </details>
      </div>
    </section>
  );
}

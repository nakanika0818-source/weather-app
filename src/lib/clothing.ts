// 服装の目安を判定する処理（画面の表示とは分けておく）
import type { ForecastItem } from "@/types/weather";

export type ClothingLevel = {
  /** この気温（℃）以上なら当てはまる。最後の段階は下限なし */
  minTemp: number;
  label: string;
  detail: string;
};

/**
 * 気温の区切り（高い順）。上から順に見て、最初に「気温 >= minTemp」となる段階を使う。
 *   25℃以上     半袖
 *   20〜24℃     長袖シャツ
 *   16〜19℃     薄手の上着
 *   12〜15℃     セーター・ジャケット
 *    8〜11℃     コート
 *    7℃以下     厚手のコート
 */
export const CLOTHING_LEVELS: ClothingLevel[] = [
  { minTemp: 25, label: "半袖", detail: "半袖シャツやTシャツで過ごしやすい気温です。" },
  { minTemp: 20, label: "長袖シャツ", detail: "長袖シャツ1枚、または半袖に羽織るものがあると安心です。" },
  { minTemp: 16, label: "薄手の上着", detail: "カーディガンや薄手のジャケットがあると快適です。" },
  { minTemp: 12, label: "セーター・ジャケット", detail: "セーターや厚手のジャケットがおすすめです。" },
  { minTemp: 8, label: "コート", detail: "トレンチコートなど、コートがあると安心です。" },
  { minTemp: -Infinity, label: "厚手のコート", detail: "ダウンなどの厚手のコートに、マフラーや手袋もあると安心です。" },
];

/** 出勤と帰宅の気温差がこの値（℃）以上なら、重ね着をすすめる */
export const LAYERING_TEMP_DIFF = 5;

/** 降水確率がこの値（%）以上なら、傘をすすめる（降水量が 0 より大きい場合も同様） */
export const UMBRELLA_POP = 50;

/**
 * 判定に使う気温。画面には四捨五入した気温を表示しているので、
 * 判定も同じ値で行い「25℃と表示されているのに長袖」のような食い違いを防ぐ。
 */
export function roundTemp(temp: number) {
  return Math.round(temp);
}

export function getClothingLevel(temp: number) {
  const t = roundTemp(temp);
  // 最後の段階は下限なしなので、必ずどれかに当てはまる
  return CLOTHING_LEVELS.find((level) => t >= level.minTemp)!;
}

export function needsUmbrella(forecast: ForecastItem) {
  return forecast.pop >= UMBRELLA_POP || forecast.precipitation > 0;
}

export type CommuteSlotInput = {
  /** 「出勤」「帰宅」などの表示名 */
  label: string;
  /** 使用した予報。予報がない場合は undefined */
  forecast: ForecastItem | undefined;
};

export type ClothingAdvice = {
  slots: (CommuteSlotInput & { level: ClothingLevel | undefined })[];
  /** 出勤・帰宅の両方の予報があり、気温差が基準以上のとき、その差（℃）。それ以外は undefined */
  layeringTempDiff: number | undefined;
  /** 傘が必要と判定された予報の表示名（例: ["帰宅"]） */
  umbrellaSlots: string[];
};

/** 出勤・帰宅の予報から服装の目安をまとめて判定する。予報がない枠は判定しない */
export function getClothingAdvice(slots: CommuteSlotInput[]): ClothingAdvice {
  const withForecast = slots.filter(
    (s): s is CommuteSlotInput & { forecast: ForecastItem } => s.forecast !== undefined,
  );

  let layeringTempDiff: number | undefined;
  // 気温差は、比べる予報が2つそろっているときだけ判定する
  if (withForecast.length === slots.length && withForecast.length >= 2) {
    const temps = withForecast.map((s) => roundTemp(s.forecast.temp));
    const diff = Math.max(...temps) - Math.min(...temps);
    if (diff >= LAYERING_TEMP_DIFF) layeringTempDiff = diff;
  }

  return {
    slots: slots.map((s) => ({
      ...s,
      level: s.forecast ? getClothingLevel(s.forecast.temp) : undefined,
    })),
    layeringTempDiff,
    umbrellaSlots: withForecast.filter((s) => needsUmbrella(s.forecast)).map((s) => s.label),
  };
}

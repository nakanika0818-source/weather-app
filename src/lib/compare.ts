// 2 都市の予報を比べる処理（画面の表示とは分けておく）
import { roundTemp } from "@/lib/clothing";
import type { ForecastItem } from "@/types/weather";

/**
 * 2 都市で共通する予報時刻（UNIX 秒・UTC、昇順）。
 * 予報はどの都市も UTC の 0・3・6…時に並ぶので、同じ dt は「同じ瞬間」の予報になる。
 */
export function findCommonDts(a: ForecastItem[], b: ForecastItem[]) {
  const bDts = new Set(b.map((f) => f.dt));
  return a.filter((f) => bDts.has(f.dt)).map((f) => f.dt);
}

/** 都市2 の気温 − 都市1 の気温（℃）。画面の表示と同じく四捨五入した気温で計算する */
export function getTempDiff(a: ForecastItem, b: ForecastItem) {
  return roundTemp(b.temp) - roundTemp(a.temp);
}

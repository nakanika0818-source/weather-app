"use client";

import { useState } from "react";
import CompareView from "@/components/CompareView";
import WeatherApp from "@/components/WeatherApp";

const TABS = [
  { id: "single", label: "1都市の予報" },
  { id: "compare", label: "2都市の比較" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ModeTabs() {
  const [active, setActive] = useState<TabId>("single");

  return (
    <div className="flex w-full flex-col gap-6">
      <div
        role="tablist"
        aria-label="表示の切り替え"
        className="grid grid-cols-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className="rounded-md px-4 py-2 font-semibold text-zinc-600 transition-colors aria-selected:bg-white aria-selected:text-zinc-900 aria-selected:shadow-sm dark:text-zinc-300 dark:aria-selected:bg-zinc-950 dark:aria-selected:text-zinc-100"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 切り替えても入力や検索結果が消えないよう、両方を描画して片方を隠す */}
      <div id="panel-single" role="tabpanel" aria-labelledby="tab-single" hidden={active !== "single"}>
        <WeatherApp />
      </div>
      <div id="panel-compare" role="tabpanel" aria-labelledby="tab-compare" hidden={active !== "compare"}>
        <CompareView />
      </div>
    </div>
  );
}

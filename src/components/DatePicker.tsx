"use client";

type Props = {
  /** 予報データがある日付（YYYY-MM-DD、昇順） */
  availableDates: string[];
  selectedDate: string;
  onChange: (date: string) => void;
};

export default function DatePicker({ availableDates, selectedDate, onChange }: Props) {
  const min = availableDates[0];
  const max = availableDates[availableDates.length - 1];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="forecast-date" className="font-semibold">
        予報の日付
      </label>
      <input
        id="forecast-date"
        type="date"
        value={selectedDate}
        min={min}
        max={max}
        // 予報がある日付以外（空欄や範囲外の手入力）は受け付けない
        onChange={(e) => {
          if (availableDates.includes(e.target.value)) onChange(e.target.value);
        }}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark] dark:focus:ring-sky-900"
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        （現地時間・選択できるのは予報がある日のみ）
      </span>
    </div>
  );
}

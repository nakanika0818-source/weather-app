"use client";

import { useState, type FormEvent } from "react";

type Props = {
  onSearch: (city: string) => void;
  isLoading: boolean;
};

export default function SearchForm({ onSearch, isLoading }: Props) {
  const [city, setCity] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <label htmlFor="city" className="sr-only">
        都市名
      </label>
      <input
        id="city"
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="都市名を入力（例: Tokyo）"
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-sky-900"
      />
      <button
        type="submit"
        disabled={!city.trim() || isLoading}
        className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "検索中…" : "検索"}
      </button>
    </form>
  );
}

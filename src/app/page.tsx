import WeatherApp from "@/components/WeatherApp";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">天気予報アプリ</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        都市名を入力して、天気予報を調べましょう。
      </p>
      <WeatherApp />
    </main>
  );
}

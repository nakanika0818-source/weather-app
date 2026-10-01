import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // OpenWeatherMap の天気アイコン画像を next/image で表示するための許可
    remotePatterns: [new URL("https://openweathermap.org/img/wn/**")],
  },
};

export default nextConfig;

// API Route（サーバー）とブラウザの両方で使う、天気データの型

export type ForecastItem = {
  /** 予報時刻（UNIX 秒・UTC） */
  dt: number;
  /** 都市の現地日付（YYYY-MM-DD）。カレンダーの日付選択に使う */
  localDate: string;
  /** 都市の現地時刻（HH:mm） */
  localTime: string;
  /** 気温（℃） */
  temp: number;
  /** 天気の説明（例: 晴天、小雨） */
  description: string;
  /** 天気アイコンのコード（例: 01d） */
  icon: string;
  /** 湿度（%） */
  humidity: number;
  /** 降水確率（%、pop を 100 倍した値） */
  pop: number;
};

export type WeatherResponse = {
  city: {
    name: string;
    country: string;
    state?: string;
    /** UTC からの時差（秒）。現地時刻の表示に使う */
    timezone: number;
  };
  /** 3 時間ごとの予報（約 5 日分） */
  forecasts: ForecastItem[];
};

export type ErrorResponse = {
  error: string;
};

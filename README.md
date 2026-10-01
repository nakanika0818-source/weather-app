# 天気予報アプリ（weather-app）

Next.js（App Router）+ TypeScript で作る天気予報 Web アプリです。

## 現在の状態

- [x] プロジェクトの初期設定
- [x] 都市名の入力欄と検索ボタン
- [x] OpenWeatherMap API との連携
- [x] 気温・天気・湿度・降水確率の表示（直近の予報）
- [x] カレンダーによる予報日の切り替え
- [ ] Vercel へのデプロイ

## ローカルでの起動方法

```bash
npm install      # 初回のみ：必要なパッケージをインストール
npm run dev      # 開発サーバーを起動
```

ブラウザで http://localhost:3000 を開きます。停止は `Ctrl + C` です。

## 環境変数

`.env.example` をコピーして `.env.local` を作成し、OpenWeatherMap の API キーを設定します。
`.env.local` は `.gitignore` により Git 管理から除外されています。

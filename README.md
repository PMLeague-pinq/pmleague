# PM League

Next.js + Prisma + Auth.js (NextAuth) の Web 版と、Expo で動くアプリ版を並走させる構成です。Web はそのまま残し、アプリは `mobile/` に置いています。

## Web 開発

1. 依存関係をインストール

```bash
npm ci
```

2. `.env.example` をコピーして `.env` を作成し、接続情報を設定

3. Prisma クライアント生成

```bash
npx prisma generate
```

4. 開発サーバー起動

```bash
npm run dev
```

## App 開発

1. `mobile/` に移動して依存関係を入れます。

```bash
cd mobile
npm install
```

2. Web API のベース URL を設定します。

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
```

Android エミュレータなら `http://10.0.2.2:3000` を使ってください。

3. Expo を起動します。

```bash
npm run start
```

アプリ版は Web の公開 API を参照します。現在はランキング、試合、チーム情報をまとめて表示するビューとして移植しています。

## Vercel Deployment

このアプリは API ルート（`/api/auth/[...nextauth]` など）を使うため、静的エクスポート（`output: export`）では動きません。

### 1. Vercel プロジェクト作成

```bash
npx --yes vercel
```

### 2. Vercel 環境変数を設定

Vercel Dashboard の Project Settings > Environment Variables に、以下を登録してください。

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`（推奨）

### 3. デプロイ

```bash
npx --yes vercel --prod --yes
```

## Build

```bash
npm run build
```

## GitHub: リポジトリを組織に移した後のローカル操作

組織 `PMLeague` にリポジトリを移動した後、ローカルの `origin` を新しいリポジトリに切り替えてプッシュしてください。SSH/HTTPS のいずれかを選んで実行します。

SSH:

```bash
git remote set-url origin git@github.com:PMLeague/pmleague.git
git push -u origin master
```

HTTPS:

```bash
git remote set-url origin https://github.com/PMLeague/pmleague.git
git push -u origin master
```

もしデフォルトブランチが `main` の場合は `master` を `main` に置き換えてください。

---

自動コミット: 組織移行テスト（軽微なドキュメントの追記）

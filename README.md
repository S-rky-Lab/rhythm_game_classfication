# 音ゲー分類プロジェクト

音楽ゲーム（音ゲー）を、ゲームシステムや操作方法などの共通項目で整理し、検索・比較できるようにするWebアプリケーションです。

## プロジェクト概要

アーケード、PC、スマートフォン、コンソール、Webなど、音ゲーにはさまざまな作品があります。このプロジェクトでは、ゲームごとの特徴を統一したデータ構造で管理し、作品同士の違いや共通点を調べやすくします。

主な用途は次のとおりです。

- 音ゲーの基本情報を登録・閲覧する
- プレイスタイル、レーン・ノーツ方式、操作方式、プレイ形態、プラットフォームで分類する
- 条件を指定してゲームを検索・絞り込む
- 複数のゲームを比較する
- ゲーム同士の関連を確認する
- 情報源、確認状態、更新履歴を記録する
- ゲーム情報の追加・変更提案を受け付ける

現在は開発中のプロトタイプです。分類項目や画面構成は今後変更される可能性があります。

## 主な画面

| パス | 内容 |
| --- | --- |
| `/` | トップページ |
| `/games` | ゲーム一覧・検索 |
| `/games/new` | ゲーム情報の新規登録 |
| `/games/[id]` | ゲーム詳細 |
| `/games/[id]/edit` | ゲーム情報の編集 |
| `/games/[id]/propose` | ゲーム情報の変更提案 |
| `/compare` | ゲーム比較 |
| `/admin/proposals` | 変更提案の管理 |

## 技術構成

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg`
- Tailwind CSS

データベースのスキーマは `prisma/schema.prisma`、マイグレーションは `prisma/migrations/`、初期データは `prisma/seed.ts` にあります。分類方針や登録項目の詳細は [`specification.md`](./specification.md) を参照してください。

## 開発環境の準備

Node.js、npm、PostgreSQLを用意してください。依存関係をインストールします。

```bash
npm install
```

ルートディレクトリに `.env` を作成し、PostgreSQLの接続URLを設定します。

```env
DATABASE_URL="postgresql://ユーザー名:パスワード@localhost:5432/rhythm_game_classification"
```

`.env` には接続情報が含まれるため、GitHubへコミットしないでください。

## データベースのセットアップ

開発用データベースにマイグレーションを適用します。

```bash
npx prisma migrate dev
```

サンプルデータを登録する場合は、次を実行します。

```bash
npx prisma db seed
```

Prisma Studioでデータを確認・編集できます。

```bash
npx prisma studio
```

## 起動方法

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

本番用のビルドと起動は次のコマンドで行います。

```bash
npm run build
npm run start
```

`npm run build` では、Prisma Clientの生成、マイグレーションの適用、Next.jsのビルドを順番に実行します。本番環境では、デプロイ先からアクセスできるPostgreSQLの `DATABASE_URL` を設定してください。

## 開発用コマンド

```bash
# 開発サーバー
npm run dev

# Lint
npm run lint

# Prisma Clientの再生成
npx prisma generate

# 開発用マイグレーションの作成・適用
npx prisma migrate dev
```

## ディレクトリ構成

```text
prisma/          スキーマ、マイグレーション、初期データ
scripts/         仕様確認などの開発用スクリプト
src/app/         Next.jsのページとルート
src/components/  共有Reactコンポーネント
src/lib/         Prismaクライアントやサーバー処理
public/          静的ファイル
```

## データの扱い方針

登録するゲーム情報は、可能な限り公式サイトや公式発表などの信頼できる情報源を確認して記録します。出典、確認状態、更新履歴を活用し、未確認の情報と確定情報を区別します。

ゲーム名、ロゴ、画像、楽曲、公式サイトの文章など、第三者が権利を持つコンテンツは、それぞれの権利者が定める利用条件に従ってください。

## ライセンス

このプロジェクトのソースコードは [MIT License](./LICENSE) のもとで公開します。

著作権表示やライセンス文は、再配布時にも保持してください。第三者が権利を持つコンテンツはMIT Licenseの対象外です。

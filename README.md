# 音ゲー分類プロジェクト

さまざまな音楽ゲーム（音ゲー）を、ゲームシステムや操作方法などの共通項目で整理し、検索・比較できるようにするWebアプリケーションです。

## 概要

音ゲーには、アーケード、PC、スマートフォン、コンソール、Webなど、さまざまなプラットフォームの作品があります。一方で、ゲームごとの特徴や似た作品を横断的に調べるための情報は分散しています。

このプロジェクトでは、各ゲームの情報を統一したデータ構造で管理し、次のような用途に対応します。

- 音ゲーの基本情報を登録・閲覧する
- プレイスタイル、レーン・ノーツ方式、操作方式、プレイ形態、プラットフォームで分類する
- 条件を指定してゲームを検索・絞り込む
- 複数のゲームを比較する
- ゲーム同士の関連を確認する
- 情報の出典や確認状態を記録する
- ゲーム情報の追加・変更提案を管理する

現在は開発中のプロトタイプです。分類項目や画面構成は、今後変更される可能性があります。

## 主な画面

- `/`：トップページ
- `/games`：ゲーム一覧・検索
- `/games/new`：ゲーム情報の新規登録
- `/games/[id]`：ゲーム詳細
- `/games/[id]/edit`：ゲーム情報の編集
- `/games/[id]/propose`：ゲーム情報の変更提案
- `/compare`：ゲーム比較
- `/admin/proposals`：変更提案の管理

## 技術構成

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- SQLite
- better-sqlite3
- Tailwind CSS

データベースのスキーマは `prisma/schema.prisma`、初期データは `prisma/seed.ts` に定義しています。分類方針や登録項目の詳細は [`specification.md`](./specification.md) を参照してください。

## 開発環境の準備

Node.js と npm をインストールしたうえで、依存関係をインストールします。

```bash
npm install
```

ルートディレクトリに `.env` を作成し、SQLiteの接続先を設定します。

```env
DATABASE_URL="file:./dev.db"
```

`.env` とローカルデータベースはGitの管理対象外です。公開リポジトリへコミットしないでください。

データベースを作成し、マイグレーションを適用します。

```bash
npx prisma migrate dev
```

サンプルデータを登録する場合は、次を実行します。

```bash
npx prisma db seed
```

## 起動方法

(Deploy設定中)
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

## 開発用コマンド

```bash
# Lint
npm run lint

# Prisma Clientの再生成
npx prisma generate

# Prisma Studioの起動
npx prisma studio
```

## ディレクトリ構成

```text
prisma/       Prismaスキーマ、マイグレーション、初期データ
scripts/      仕様確認などの開発用スクリプト
src/app/      Next.jsのページとルート
src/components/ 画面で共有するReactコンポーネント
src/lib/      Prismaクライアントやサーバー処理
public/       静的ファイル
```

## データの扱いについて

登録するゲーム情報は、可能な限り公式サイトや公式発表などの信頼できる情報源を確認して記録します。出典、確認状態、更新履歴を活用し、未確認の情報と確定情報を区別する方針です。

## ライセンス

このプロジェクトのソースコードは [MIT License](./LICENSE) のもとで公開します。

ゲーム名、ロゴ、画像、楽曲、公式サイトの文章など、第三者が権利を持つコンテンツはMIT Licenseの対象外です。それぞれの権利者が定める利用条件に従ってください。

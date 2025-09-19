# Household Budget App

家計簿アプリケーションのバックエンドAPI

## 概要

個人や家庭の収入と支出を記録・管理し、財務状況を把握できるWebアプリケーションです。複数のユーザーが共同で出費を管理・共有し、家族やルームメイトとの費用分担を透明化できる機能も提供します。

## 技術スタック

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator + class-transformer

## セットアップ

### 前提条件

- Node.js 18+
- PostgreSQL 14+
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定

# PostgreSQLをDockerで起動
npm run docker:up

# Prismaクライアントの生成
npm run prisma:generate

# データベースマイグレーション
npm run prisma:migrate
```

### Docker使用方法

```bash
# PostgreSQL + pgAdminコンテナを起動
npm run docker:up

# コンテナを停止
npm run docker:down

# PostgreSQLのログを確認
npm run docker:logs

# データベースをリセット（データも削除）
npm run docker:reset
```

### pgAdmin（データベース管理ツール）

pgAdminはWebベースのPostgreSQL管理ツールです。

**アクセス情報:**
- URL: `http://localhost:8080`
- Email: `admin@household-budget.com`
- Password: `admin123`

**データベース接続情報:**
- Host: `postgres`（コンテナ内での接続）
- Port: `5432`
- Database: `household_budget_db`
- Username: `root`
- Password: `password`

**使用方法:**
1. ブラウザで `http://localhost:8080` にアクセス
2. 上記のEmail/Passwordでログイン
3. 事前設定されたサーバー「Household Budget DB」が表示される
4. サーバーをクリックしてデータベースパスワード（`password`）を入力
5. データベースのテーブル、データを確認・編集可能

### 開発サーバーの起動

```bash
npm run start:dev
```

アプリケーションは `http://localhost:3000` で起動します。

## API ドキュメント

### Swagger UI

インタラクティブなAPI ドキュメントは以下のURLで確認できます：

**URL**: `http://localhost:3000/api/docs`

Swagger UIでは以下のことができます：

- 全APIエンドポイントの詳細確認
- リクエスト/レスポンスの例を確認
- 直接APIをテスト実行
- JWT認証の設定と使用

### 認証の使用方法

1. `/api/auth/register` でユーザー登録
2. レスポンスから `accessToken` をコピー
3. Swagger UIの「Authorize」ボタンをクリック
4. `Bearer <your-token>` を入力して認証設定
5. 保護されたエンドポイントをテスト可能

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### 取引管理
- `GET /api/transactions` - 取引一覧取得
- `POST /api/transactions` - 取引作成
- `PUT /api/transactions/:id` - 取引更新
- `DELETE /api/transactions/:id` - 取引削除

### 予算管理
- `GET /api/budgets` - 予算一覧取得
- `POST /api/budgets` - 予算作成
- `PUT /api/budgets/:id` - 予算更新

### グループ管理
- `GET /api/groups` - グループ一覧取得
- `POST /api/groups` - グループ作成
- `POST /api/groups/:id/join` - グループ参加
- `GET /api/groups/:id/expenses` - 共同出費一覧
- `POST /api/groups/:id/expenses` - 共同出費作成

## テスト

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:cov
```

## データベース

### マイグレーション

```bash
# 新しいマイグレーション作成
npm run prisma:migrate

# マイグレーション適用
npm run prisma:deploy

# Prisma Studio起動
npm run prisma:studio
```
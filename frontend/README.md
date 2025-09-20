# 家計簿アプリ - フロントエンド

Vue 3 + TypeScript + Viteで構築された家計簿アプリのフロントエンドです。

## 技術スタック

- **Vue 3** - Composition API + TypeScript
- **Vue Router** - ページルーティング
- **Pinia** - 状態管理
- **Tailwind CSS** - スタイリング
- **Chart.js + vue-chartjs** - グラフ表示
- **Axios** - HTTP通信
- **Vite** - ビルドツール

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

### プロダクションビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## プロジェクト構造

```
src/
├── assets/          # CSS、画像などの静的ファイル
├── components/      # 再利用可能なVueコンポーネント
├── composables/     # Composition API関数
├── router/          # Vue Routerの設定
├── services/        # API通信サービス
├── stores/          # Pinia状態管理
├── types/           # TypeScript型定義
├── views/           # ページコンポーネント
├── App.vue          # ルートコンポーネント
└── main.ts          # エントリーポイント
```

## 環境変数

`.env`ファイルを作成して以下の変数を設定してください：

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=家計簿アプリ
VITE_APP_VERSION=1.0.0
```

## 機能

### 実装済み

- ✅ プロジェクト初期設定
- ✅ Vue Router設定
- ✅ Pinia状態管理設定
- ✅ Tailwind CSS設定
- ✅ Chart.js設定
- ✅ Axios API通信設定
- ✅ 認証ストア
- ✅ 取引管理ストア
- ✅ グループ管理ストア
- ✅ チャート用Composable
- ✅ 基本的なビューコンポーネント

### 実装予定

- 🔄 認証画面の詳細実装
- 🔄 取引管理画面の詳細実装
- 🔄 ダッシュボード画面の詳細実装
- 🔄 予算管理画面の詳細実装
- 🔄 グループ管理画面の詳細実装
- 🔄 データエクスポート機能
- 🔄 単体テスト
- 🔄 E2Eテスト

## API通信

バックエンドAPIとの通信は`src/services/api.ts`で管理されています。以下のエンドポイントが設定済みです：

- 認証 (`/auth/*`)
- 取引管理 (`/transactions/*`)
- 予算管理 (`/budgets/*`)
- ダッシュボード (`/dashboard/*`)
- グループ管理 (`/groups/*`)
- データエクスポート (`/export/*`)

## 状態管理

Piniaを使用して以下のストアが設定されています：

- `useAuthStore` - 認証状態管理
- `useTransactionsStore` - 取引データ管理
- `useGroupsStore` - グループデータ管理

## スタイリング

Tailwind CSSを使用し、カスタムテーマカラーを設定しています：

- オレンジテーマ（デフォルト）
- ブルーテーマ
- グリーンテーマ

カスタムCSSクラス：
- `.btn-primary` - プライマリボタン
- `.btn-secondary` - セカンダリボタン
- `.form-input` - フォーム入力フィールド
- `.card` - カードコンポーネント

## 開発ガイドライン

1. **コンポーネント**: 再利用可能なコンポーネントは`components/`に配置
2. **ビュー**: ページレベルのコンポーネントは`views/`に配置
3. **型定義**: TypeScript型は`types/index.ts`で管理
4. **API**: API通信は`services/api.ts`を使用
5. **状態管理**: グローバル状態はPiniaストアで管理
6. **スタイル**: Tailwind CSSクラスを優先、必要に応じてカスタムCSS
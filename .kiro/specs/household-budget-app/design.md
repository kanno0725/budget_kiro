# 設計書

## 概要

家計簿アプリは、個人の財務管理と複数ユーザーでの共同出費管理を提供するWebアプリケーションです。Vue 3 + TypeScriptをフロントエンド、NestJS + TypeScriptをバックエンド、PostgreSQLをデータベースとして使用し、RESTful APIアーキテクチャで構築します。

## アーキテクチャ

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vue 3)       │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│   TypeScript    │    │   TypeScript    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック

**フロントエンド:**
- Vue 3 (Composition API + TypeScript)
- Vue Router (ページルーティング)
- Chart.js + vue-chartjs (グラフ表示)
- Tailwind CSS (スタイリング)
- Axios (HTTP通信)
- Pinia (状態管理)

**バックエンド:**
- NestJS (TypeScript)
- Passport + JWT (認証)
- bcrypt (パスワードハッシュ化)
- class-validator (バリデーション)
- class-transformer (データ変換)

**データベース:**
- PostgreSQL 14+
- Prisma (ORM)

**開発・デプロイ:**
- Vite (フロントエンドビルドツール)
- ESLint + Prettier (コード品質)
- Vitest (フロントエンドテスト)
- Jest (バックエンドテスト)
- Playwright (E2Eテスト)

## UI/UXデザイン

### ログイン画面

ログイン画面は、ユーザーがアプリケーションにアクセスするための最初のエントリーポイントです。シンプルで使いやすいデザインを採用し、ユーザーエクスペリエンスを重視します。

![ログイン画面モックアップ](../../docs/login-screen-mockup.drawio.svg)

**デザイン要素:**

- **背景**: グラデーション背景（オレンジ系）でモダンな印象
- **ヘッダー**: アプリケーション名「家計簿アプリ」とロゴアイコン（¥マーク）
- **テーマカラー選択**: ヘッダー右上にカラーピッカー（オレンジ、青、緑）
- **ログインフォーム**: 中央に配置されたカード形式のフォーム（ドロップシャドウ付き）
  - フォームタイトルとサブタイトル
  - メールアドレス入力フィールド
  - パスワード入力フィールド
  - 「ログイン状態を保持する」チェックボックス（チェック済み状態）
  - ログインボタン（テーマカラー、シャドウ付き）
- **補助リンク**:
  - パスワードリセットリンク（右寄せ）
  - 区切り線（「または」テキスト付き）
  - 新規登録リンク
- **フッター**: コピーライト情報

**インタラクション:**

- テーマカラー変更機能（ユーザー設定保存）
- フォームバリデーション（リアルタイム）
- ローディング状態の表示（スピナー）
- エラーメッセージの表示（赤色背景）
- 成功メッセージの表示（緑色背景）
- レスポンシブデザイン対応
- ホバーエフェクト（ボタン、リンク）

**テーマカラーシステム:**

**デフォルトテーマ（オレンジ）:**
- プライマリ: #ea580c (オレンジ)
- プライマリライト: #fed7aa (ライトオレンジ)
- プライマリダーク: #c2410c (ダークオレンジ)
- 背景グラデーション: #fff7ed → #fed7aa

**代替テーマ（青）:**
- プライマリ: #2563eb (青)
- プライマリライト: #dbeafe (ライトブルー)
- プライマリダーク: #1d4ed8 (ダークブルー)

**代替テーマ（緑）:**
- プライマリ: #16a34a (緑)
- プライマリライト: #dcfce7 (ライトグリーン)
- プライマリダーク: #15803d (ダークグリーン)

**共通カラー:**
- セカンダリ: #6b7280 (グレー)
- エラー: #dc2626 (赤)
- 成功: #16a34a (緑)
- 背景: #ffffff (白)
- ボーダー: #e5e7eb (ライトグレー)
- テキスト: #1f2937 (ダークグレー)

## コンポーネントとインターフェース

### フロントエンドコンポーネント構造

```
src/
├── components/
│   ├── common/
│   │   ├── AppHeader.vue
│   │   ├── AppNavigation.vue
│   │   └── LoadingSpinner.vue
│   ├── auth/
│   │   ├── LoginForm.vue
│   │   └── RegisterForm.vue
│   ├── transactions/
│   │   ├── TransactionForm.vue
│   │   ├── TransactionList.vue
│   │   └── TransactionItem.vue
│   ├── dashboard/
│   │   ├── DashboardView.vue
│   │   ├── CategoryChart.vue
│   │   └── MonthlyTrendChart.vue
│   ├── budget/
│   │   ├── BudgetForm.vue
│   │   └── BudgetProgress.vue
│   └── groups/
│       ├── GroupList.vue
│       ├── GroupForm.vue
│       ├── SharedExpenseForm.vue
│       ├── SettlementView.vue
│       ├── GroupBalances.vue
│       └── SplitEquallyModal.vue
├── views/
│   ├── HomeView.vue
│   ├── TransactionsView.vue
│   ├── DashboardView.vue
│   ├── BudgetView.vue
│   └── GroupsView.vue
├── composables/
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   └── useGroups.ts
├── stores/
│   ├── auth.ts
│   ├── transactions.ts
│   └── groups.ts
├── services/
│   └── api.ts
└── types/
    └── index.ts
```

### バックエンドAPI構造

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   ├── transactions/
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── transactions.module.ts
│   │   └── dto/
│   │       ├── create-transaction.dto.ts
│   │       └── update-transaction.dto.ts
│   ├── budgets/
│   │   ├── budgets.controller.ts
│   │   ├── budgets.service.ts
│   │   ├── budgets.module.ts
│   │   └── dto/
│   │       └── create-budget.dto.ts
│   └── groups/
│       ├── groups.controller.ts
│       ├── groups.service.ts
│       ├── groups.module.ts
│       └── dto/
│           ├── create-group.dto.ts
│           ├── create-shared-expense.dto.ts
│           └── split-equally.dto.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── database/
│   ├── prisma/
│   │   └── schema.prisma
│   └── migrations/
└── config/
    └── configuration.ts
```

### APIエンドポイント

**認証:**
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

**取引管理:**
- `GET /api/transactions` - 取引一覧取得
- `POST /api/transactions` - 取引作成
- `PUT /api/transactions/:id` - 取引更新
- `DELETE /api/transactions/:id` - 取引削除

**予算管理:**
- `GET /api/budgets` - 予算一覧取得
- `POST /api/budgets` - 予算作成
- `PUT /api/budgets/:id` - 予算更新

**グループ管理:**
- `GET /api/groups` - グループ一覧取得
- `POST /api/groups` - グループ作成
- `POST /api/groups/:id/join` - グループ参加
- `GET /api/groups/:id/expenses` - 共同出費一覧
- `POST /api/groups/:id/expenses` - 共同出費作成
- `GET /api/groups/:id/balances` - メンバー残高取得
- `POST /api/groups/:id/split-equally` - 割り勘清算実行
- `GET /api/groups/:id/settlements` - 精算状況取得
- `POST /api/groups/:id/settlements` - 個別精算記録

## データモデル

### データベーススキーマ

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  transactions Transaction[]
  budgets      Budget[]
  groupMembers GroupMember[]
  paidExpenses SharedExpense[] @relation("Payer")
  settlements  Settlement[]

  @@map("users")
}

model Transaction {
  id          String   @id @default(cuid())
  amount      Decimal
  category    String
  description String?
  date        DateTime
  type        TransactionType
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

model Budget {
  id       String  @id @default(cuid())
  category String
  amount   Decimal
  month    Int
  year     Int
  userId   String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, category, month, year])
  @@map("budgets")
}

model Group {
  id          String   @id @default(cuid())
  name        String
  inviteCode  String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members         GroupMember[]
  sharedExpenses  SharedExpense[]

  @@map("groups")
}

model GroupMember {
  id      String @id @default(cuid())
  userId  String
  groupId String
  role    GroupRole @default(MEMBER)

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@map("group_members")
}

model SharedExpense {
  id          String   @id @default(cuid())
  amount      Decimal
  description String
  date        DateTime
  payerId     String
  groupId     String
  createdAt   DateTime @default(now())

  payer  User  @relation("Payer", fields: [payerId], references: [id])
  group  Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  splits ExpenseSplit[]

  @@map("shared_expenses")
}

model ExpenseSplit {
  id        String  @id @default(cuid())
  expenseId String
  userId    String
  amount    Decimal

  expense SharedExpense @relation(fields: [expenseId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
  @@map("expense_splits")
}

model Settlement {
  id        String   @id @default(cuid())
  fromId    String
  toId      String
  amount    Decimal
  groupId   String
  createdAt DateTime @default(now())

  from User @relation(fields: [fromId], references: [id])

  @@map("settlements")
}

model GroupBalance {
  id      String  @id @default(cuid())
  userId  String
  groupId String
  balance Decimal @default(0)

  @@unique([userId, groupId])
  @@map("group_balances")
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum GroupRole {
  ADMIN
  MEMBER
}
```

## エラーハンドリング

### フロントエンド

- APIエラーレスポンスの統一的な処理
- ユーザーフレンドリーなエラーメッセージ表示
- ネットワークエラー時の再試行機能
- フォームバリデーションエラーの表示

### バックエンド

- 統一されたエラーレスポンス形式
- HTTPステータスコードの適切な使用
- ログ記録とエラー追跡
- バリデーションエラーの詳細情報提供

```typescript
// エラーレスポンス形式
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## テスト戦略

### フロントエンド

- **単体テスト**: Vue Test Utils + Vitest
  - Vueコンポーネントの動作テスト
  - Composablesのテスト
  - ユーティリティ関数のテスト

- **統合テスト**: 
  - APIとの連携テスト
  - ルーター遷移のテスト

### バックエンド

- **単体テスト**: Jest + NestJS Testing
  - コントローラーのテスト
  - サービス層のテスト
  - ガードとインターセプターのテスト

- **統合テスト**:
  - APIエンドポイントのテスト
  - データベース操作のテスト
  - 認証フローのテスト

- **E2Eテスト**: Playwright
  - 主要なユーザーフローのテスト
  - 認証フローのテスト
  - 共同出費管理フローのテスト
  - クロスブラウザテスト（Chrome、Firefox、Safari）
  - モバイルビューポートテスト

### テストデータ

- テスト用のシードデータ作成
- モックデータの生成
- テスト環境でのデータベース初期化

### E2Eテスト構成

```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── register.spec.ts
│   ├── transactions/
│   │   ├── create-transaction.spec.ts
│   │   ├── edit-transaction.spec.ts
│   │   └── transaction-list.spec.ts
│   ├── dashboard/
│   │   └── dashboard-charts.spec.ts
│   ├── budget/
│   │   ├── create-budget.spec.ts
│   │   └── budget-alerts.spec.ts
│   └── groups/
│       ├── create-group.spec.ts
│       ├── join-group.spec.ts
│       ├── shared-expenses.spec.ts
│       ├── split-equally.spec.ts
│       └── settlements.spec.ts
├── fixtures/
│   ├── users.json
│   ├── transactions.json
│   └── groups.json
├── page-objects/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── TransactionsPage.ts
│   └── GroupsPage.ts
└── utils/
    ├── test-setup.ts
    └── database-helpers.ts
```

**E2Eテスト機能:**
- 各ブラウザでの動作確認
- レスポンシブデザインのテスト
- パフォーマンステスト
- アクセシビリティテスト
- 視覚的回帰テスト（スクリーンショット比較）
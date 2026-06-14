# FitTracker — 筋トレ & 栄養管理ダッシュボード

AIを活用した筋トレ記録・栄養管理Webアプリです。  
Gemini AIによる食事解析・目標最適化・パーソナルアドバイスと、Supabaseによるクラウド永続化を組み合わせています。

---

## 目次

1. [技術スタック](#技術スタック)
2. [画面構成](#画面構成)
3. [実装済み機能](#実装済み機能)
4. [外部サービス連携](#外部サービス連携)
5. [データモデル](#データモデル)
6. [APIエンドポイント](#apiエンドポイント)
7. [コンポーネント一覧](#コンポーネント一覧)
8. [環境変数](#環境変数)
9. [ローカル起動手順](#ローカル起動手順)

---

## 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| フレームワーク | Next.js 16.2.9（App Router） |
| 言語 | TypeScript 5 |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| アイコン | lucide-react |
| グラフ | Recharts 3 |
| DB / BaaS | Supabase（PostgreSQL） |
| AI | Google Gemini API（`gemini-2.5-flash`）|
| Gemini SDK | `@google/genai` v2 |
| ホスティング | （未設定 — ローカル開発中） |

---

## 画面構成

アプリは **シングルページ（`/`）** の構成で、タブ切り替えにより3つのビューを持ちます。

```
┌────────────────────────────────────────────────────┐
│  ヘッダー                                          │
│  [FitTrackerロゴ]  [履歴ボタン]  [AI目標ボタン]   │
├────────────────────────────────────────────────────┤
│  (カレンダーパネル — 折りたたみ)                  │
│  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ ミニカレンダー│  │ 履歴ガイドパネル          │  │
│  └──────────────┘  └───────────────────────────┘  │
├────────────────────────────────────────────────────┤
│  日付バナー（選択中の日付 / 今日に戻るボタン）    │
├────────────────────────────────────────────────────┤
│  タブ: [ダッシュボード] [筋トレ記録] [栄養記録]   │
├────────────────────────────────────────────────────┤
│  ダッシュボード                                    │
│  ┌───────────────────┐  ┌───────────────────────┐ │
│  │ 栄養摂取サマリー  │  │ トレーニングサマリー  │ │
│  └───────────────────┘  └───────────────────────┘ │
│  ┌─────────────────────────────────────────────┐   │
│  │ AIトレーナーからのアドバイス（全幅）        │   │
│  └─────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────┤
│  筋トレ記録タブ                                    │
│  ┌───────────────────┐  ┌───────────────────────┐ │
│  │ WorkoutForm       │  │ WorkoutSummary        │ │
│  └───────────────────┘  └───────────────────────┘ │
├────────────────────────────────────────────────────┤
│  栄養記録タブ                                      │
│  ┌───────────────────┐  ┌───────────────────────┐ │
│  │ NutritionForm     │  │ NutritionSummary      │ │
│  └───────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────────────────┘

モーダル（オーバーレイ）:
  GoalOptimizeModal — AI目標最適化
```

---

## 実装済み機能

### 1. 日付選択 & 履歴閲覧

- ヘッダーの **「履歴」ボタン** でミニカレンダーパネルをトグル表示
- カレンダー上で記録のある日には **紫のドット** が表示される
- 日付をクリックするとその日のデータに切り替わる（ページ遷移なし）
- 過去の日付を選択中は **「今日に戻る」ボタン** が表示される
- 今日 → オレンジ枠、選択中 → オレンジ塗り、記録あり → 紫ドット

### 2. 筋トレ記録

**入力（WorkoutForm）**

- 種目名をコンボボックスで選択 or 自由テキスト入力（プリセット10種目あり）
  - ベンチプレス、スクワット、デッドリフト、ショルダープレス、ラットプルダウン、ダンベルカール、トライセプスプッシュダウン、レッグプレス、チェストフライ、バーベルロウ
- セットを複数追加可（重量kg × 回数の組み合わせ）
- 任意のメモ欄
- 送信するとSupabaseの `workouts` テーブルに保存され、即座にサマリーへ反映

**サマリー表示（WorkoutSummary）**

- 種目数 / 総セット数 / 総ボリューム（kg×rep の合計、トン表示）
- 種目別ボリュームの **棒グラフ**（Recharts BarChart）
- 各種目のセット詳細リスト（重量×回数タグ + メモ）

### 3. 栄養記録

**入力（NutritionForm）**

- **AI栄養自動解析**（Gemini 2.5 Flash）
  - 自然文で食事内容を入力（例：「牛丼大盛り、みそ汁、生卵」）
  - Ctrl+Enter または「PFCを自動計算する」ボタンで実行
  - カロリー・タンパク質・炭水化物・脂質が自動入力される
- **手動入力**（AI解析後の値を直接編集も可能）
  - 食事の種類（朝食 / 昼食 / 夕食 / 間食 / プロテインシェイク）
  - カロリー（kcal）・タンパク質・炭水化物・脂質（g）
- 入力中のリアルタイムプレビュー表示
- 送信するとSupabaseの `meals` テーブルに保存

**サマリー表示（NutritionSummary）**

- カロリー達成率のプログレスバー（目標超過時は赤表示）
- タンパク質・炭水化物・脂質それぞれの目標対比バー
- PFCバランスの **ドーナツ円グラフ**（カロリー換算）（Recharts PieChart）
- 食事ログリスト（各食事のPFC詳細）
- 目標未設定時はAI目標設定への誘導UI

### 4. AI目標最適化（GoalOptimizeModal）

ヘッダーの **「AI目標を設定/更新」ボタン** または各所のSparklesボタンから起動。

- 入力項目：身長・体重・年齢・性別・活動レベル・目的（バルクアップ / 減量 / 維持）
- Gemini 2.5 Flash が管理栄養士・パーソナルトレーナーとして最適なPFC目標を計算
- 結果として **カロリー・タンパク質・炭水化物・脂質の目標値** と **設定理由の解説文** を返す
- 「この目標を適用する」でSupabaseの `target_settings` テーブルに保存、即座に全画面に反映

### 5. AIトレーナーアドバイス（AITrainerCard）

ダッシュボードの最下部に常時表示。

- 今日の栄養摂取実績と目標値を比較してGemini 2.5 Flashがアドバイスを生成
- キャラクター設定：「優しく褒めて伸ばしてくれる管理栄養士お姉さん」（ポジティブな口調）
- 4種類のアドバイスカード：`success`（グッド）/ `info`（情報）/ `warning`（注意）/ `tip`（ヒント）
- 生成したアドバイスはSupabaseの `trainer_advices` テーブルに日付単位でキャッシュ（同日の再読み込み時はAPIコールしない）
- 「再分析」ボタンで手動でAPI再実行可能
- 目標未設定 / 食事記録なし の場合はそれぞれ誘導メッセージを表示
- 過去日付の場合はキャッシュから表示（記録なし日はその旨を表示）

---

## 外部サービス連携

### Supabase（データ永続化）

プロジェクトURL: `https://qykvngrdgvuzvgdejhdf.supabase.co`

| テーブル名 | 用途 | 主要カラム |
|---|---|---|
| `workouts` | 筋トレ記録 | `id`, `date`, `exercise`, `sets`（JSONB）, `note`, `created_at` |
| `meals` | 食事記録 | `id`, `date`, `meal`, `calories`, `protein`, `carbs`, `fat`, `created_at` |
| `target_settings` | 日次栄養目標 | `id`, `calories`, `protein`, `carbs`, `fat`, `created_at` |
| `trainer_advices` | AIアドバイスキャッシュ | `date`（ユニークキー）, `advices`（JSONB） |

- 認証（Auth）は**未使用**（ログイン機能なし）
- セッション管理・自動トークンリフレッシュ無効化済み

### Google Gemini API（AI機能）

モデル: `gemini-2.5-flash`  
SDK: `@google/genai`（v2）

| 利用箇所 | エンドポイント | 入力 | 出力 |
|---|---|---|---|
| 食事AI解析 | `POST /api/analyze-meal` | 自然文の食事説明 | `{calories, protein, fat, carbohydrates}` |
| 目標最適化 | `POST /api/optimize-targets` | 身体データ+目的 | `{calories, protein, fat, carbs, explanation}` |
| トレーナーアドバイス | `POST /api/trainer-advice` | 栄養実績と目標の差分 | `{advices: [{kind, title, text}]}` |

---

## データモデル（TypeScript型定義）

```typescript
// src/types/index.ts

type WorkoutEntry = {
  id: string;
  date: string;           // "YYYY-MM-DD"
  exercise: string;
  sets: SetEntry[];
  note?: string;
};

type SetEntry = {
  weight: number;         // kg
  reps: number;
};

type NutritionEntry = {
  id: string;
  date: string;
  meal: string;           // "朝食" | "昼食" | "夕食" | "間食" | "プロテインシェイク"
  calories: number;       // kcal
  protein: number;        // g
  carbs: number;          // g
  fat: number;            // g
};

type DailyGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type UserProfile = {
  height: number;
  weight: number;
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "bulk" | "cut" | "maintain";
};
```

---

## APIエンドポイント

### `POST /api/analyze-meal`

食事テキストからPFCを推測する。

**リクエスト**
```json
{ "mealText": "牛丼大盛り、みそ汁、生卵" }
```

**レスポンス（成功）**
```json
{ "calories": 820, "protein": 35, "fat": 22, "carbohydrates": 110 }
```

---

### `POST /api/optimize-targets`

身体データから目標PFCを計算する。

**リクエスト**
```json
{
  "height": 170,
  "weight": 70,
  "age": 25,
  "gender": "male",
  "activityLevel": "moderate",
  "goal": "bulk"
}
```

**レスポンス（成功）**
```json
{
  "calories": 2800,
  "protein": 175,
  "fat": 80,
  "carbs": 330,
  "explanation": "設定理由の解説文..."
}
```

---

### `POST /api/trainer-advice`

当日の栄養実績と目標を比較してアドバイスを生成する。

**リクエスト**
```json
{
  "totals": { "calories": 1800, "protein": 100, "carbs": 220, "fat": 55 },
  "goals":  { "calories": 2500, "protein": 175, "carbs": 300, "fat": 70 }
}
```

**レスポンス（成功）**
```json
{
  "advices": [
    { "kind": "success", "title": "カロリーの管理が完璧です！", "text": "..." },
    { "kind": "tip",     "title": "タンパク質をあと75g摂りましょう", "text": "..." }
  ]
}
```

`kind` の種類: `"success"` / `"info"` / `"warning"` / `"tip"`

---

## コンポーネント一覧

```
src/
├── app/
│   ├── page.tsx                  メインページ（全体レイアウト・状態管理）
│   ├── layout.tsx                ルートレイアウト
│   ├── globals.css               グローバルスタイル + カスタムアニメーション
│   └── api/
│       ├── analyze-meal/route.ts     食事AI解析API
│       ├── optimize-targets/route.ts 目標最適化API
│       └── trainer-advice/route.ts   AIアドバイスAPI
│
├── components/
│   ├── AITrainerCard.tsx         AIトレーナーアドバイスカード
│   ├── GoalOptimizeModal.tsx     AI目標最適化モーダル
│   ├── MiniCalendar.tsx          ミニカレンダー（日付選択・履歴ドット表示）
│   ├── NutritionForm.tsx         食事記録フォーム（AI解析付き）
│   ├── NutritionSummary.tsx      栄養摂取サマリー（グラフ・進捗バー）
│   ├── WorkoutForm.tsx           筋トレ記録フォーム
│   ├── WorkoutSummary.tsx        トレーニングサマリー（棒グラフ）
│   └── ui/                       shadcn/ui コンポーネント群
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       └── tabs.tsx
│
├── hooks/
│   └── useDailyData.ts           日付別データ取得・キャッシュ・書き込みフック
│
├── lib/
│   ├── supabase.ts               Supabaseクライアント
│   └── utils.ts                  Tailwindクラス結合ユーティリティ（cn）
│
├── types/
│   └── index.ts                  全型定義
│
└── data/
    └── dummy.ts                  （ダミーデータ — 現在は未使用）
```

---

## 環境変数

`.env.local` に以下を設定してください。

```env
# Google Gemini API キー
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> `GEMINI_API_KEY` はサーバーサイド専用（`NEXT_PUBLIC_` なし）です。  
> Supabase キーはクライアントサイドでも使用するため `NEXT_PUBLIC_` プレフィックスが必要です。

---

## ローカル起動手順

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開くと動作します。

```bash
# 本番ビルド
npm run build
npm run start

# Lint
npm run lint
```

---

## 現在の制限事項・未実装

- **ユーザー認証なし** — 全データが単一の匿名ユーザーとして保存される
- **食事記録の削除機能なし** — 一度登録したデータの削除・編集UIが未実装
- **筋トレ記録の削除機能なし** — 同上
- **目標の日付管理** — `target_settings` テーブルから最新1件を取得するため、日付別の目標変更履歴は参照されない
- **モバイル最適化** — レスポンシブ対応はしているが、モバイル専用UIの調整は未実施

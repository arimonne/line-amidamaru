# line-amidamaru

🎲 LINE グループ向けあみだくじシステム

## 概要

**line-amidamaru** は、LINE グループ内で公平な抽選を行うあみだくじシステムです。

### 主な特徴

- **4フェーズの自動ワークフロー**
  - Phase 1: 参加者登録
  - Phase 2: あみだ自動生成（スケジュール実行）
  - Phase 3: スタート位置ランダム割当
  - Phase 4: 抽選実行＆結果発表

- **公平性を確保**
  - SHA-256 ハッシュで整合性検証
  - シード値ベースの疑似乱数で再現可能

- **LINE との統合**
  - LIFF で ブラウザ UI を提供
  - グループ通知と個別メッセージ送信
  - ユーザー認証完全対応

- **Supabase によるデータ管理**
  - PostgreSQL ベースの信頼性
  - Row Level Security (RLS)
  - リアルタイム同期

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                       LINE Messaging API                     │
└────────────────────────┬──────────────────────────────────────┘
                         │
            ┌────────────┴──────────────┐
            │                           │
      ┌─────▼────┐              ┌──────▼──────┐
      │ LIFF App │              │ Webhook API │
      │(Browser) │              │ (Webhook)   │
      └─────┬────┘              └──────┬──────┘
            │                          │
            └──────────────┬───────────┘
                           │
            ┌──────────────▼───────────────┐
            │    Next.js API Routes       │
            │  (Phase 1-4 Processing)     │
            └──────────────┬───────────────┘
                           │
            ┌──────────────▼───────────────┐
            │      Supabase DB            │
            │  (PostgreSQL + RLS)         │
            └─────────────────────────────┘

    ┌─────────────────────────────┐
    │   Cron Job (node-cron)      │
    │   Daily 00:00 UTC Trigger   │
    └──────────┬──────────────────┘
               │
         ┌─────▼─────┐
         │ Phase 2   │
         │ API Call  │
         └───────────┘
```

## セットアップ手順

### 1. 環境構築

```bash
# リポジトリをクローン
git clone https://github.com/arimonne/line-amidamaru.git
cd line-amidamaru

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して各サービスのキーを設定
```

### 2. Supabase の初期化

```bash
# Supabase SQL Editor で schema.sql を実行
# または CLI:
supabase db push
```

### 3. LINE Developers での設定

1. [LINE Developers](https://developers.line.biz/ja/) でチャネルを作成
2. Channel Secret と Access Token を取得
3. LIFF App を登録し、LIFF ID を取得
4. Webhook URL を設定（`https://your-domain.com/api/webhook/line`）

### 4. デプロイ

```bash
# ローカル開発
npm run dev

# 本番環境へデプロイ（Vercel 推奨）
npm run build
npm start
```

## 使用方法

### あみだイベント作成（管理者）

1. Supabase コンソール、または管理画面から新規あみだを作成
2. `title`, `description`, `max_participants`, `registration_deadline` を設定
3. 景品を追加

### 参加者フロー

1. **Phase 1**: LINE グループ内の LIFF リンクから参加登録
2. **Phase 2**: 締切時刻に自動あみだ生成（Cron ジョブ）
3. **Phase 3**: スタート位置をランダム割当（管理者トリガー）
4. **Phase 4**: 各参加者が LIFF から「結果を確認」をクリック → 落下パスアニメーション → 結果表示

## API リファレンス

### Phase 1: 参加者登録

```http
POST /api/phase1/register-participant
Content-Type: application/json

{
  "lottery_id": "uuid",
  "line_user_id": "U...",
  "line_display_name": "ユーザー名"
}

200 OK:
{
  "status": "registered",
  "participant": { ... }
}
```

### Phase 2: あみだ自動生成

```http
POST /api/phase2/generate-amida
Content-Type: application/json

200 OK:
{
  "results": [
    {
      "lottery_id": "uuid",
      "status": "success",
      "amida_hash": "sha256_hash_value"
    }
  ]
}
```

### Phase 3: スタート位置割当

```http
POST /api/phase3/assign-columns
Content-Type: application/json

{
  "lottery_id": "uuid"
}

200 OK:
{
  "status": "success",
  "message": "Columns assigned and notifications sent"
}
```

### Phase 4: 抽選実行

```http
POST /api/phase4/execute-lottery
Content-Type: application/json

{
  "lottery_id": "uuid"
}

200 OK:
{
  "status": "success",
  "results": [ ... ]
}
```

## あみだくじアルゴリズム

### 仕組み

1. **あみだ構造生成**
   - N列のあみだを疑似乱数で生成
   - 各行で隣同士の列を繋ぐ「横線」を配置
   - 重複や矛盾のない有効なあみだのみ生成

2. **景品割当**
   - 下段のゴール位置ごとに景品をシャッフル割当
   - シード値から決定的に行う（再現可能）

3. **落下計算**
   - 参加者のスタート位置（列番号）から開始
   - あみだの横線に沿って移動
   - 最終的なゴール位置の景品を決定

4. **公平性検証**
   - あみだ全体の SHA-256 ハッシュを計算
   - グループに公開してハッシュ値で検証可能
   - 事後改変不可能

### 例

```
スタート位置:  1列  2列  3列
             │   │   │
             ├─┤   │
             │   ├─┤
             ├─┤   │
             │   │   │

ゴール:     景品A  景品B  景品C

1列から開始 → 2列に移動 → 3列に移動 → 景品C
```

## トラブルシューティング

### LIFF が読み込まれない

- LIFF ID が正しいか確認
- Supabase キーが有効か確認
- ブラウザコンソールでエラーを確認

### Cron ジョブが実行されない

- サーバーが起動しているか確認
- タイムゾーン設定を確認（UTC 基準）
- サーバーログで Cron トリガーを確認

### あみだが生成されない

- Phase 1 で実際に参加者が登録されているか確認
- 締切時刻が正しく設定されているか確認
- Supabase のアクセスキーが有効か確認

## 開発

### コード構造

```
src/
├── app/
│   ├── api/
│   │   ├── phase1/       # 参加者登録
│   │   ├── phase2/       # あみだ生成
│   │   ├── phase3/       # 位置割当
│   │   └── phase4/       # 抽選実行
│   └── liff/
│       └── page.tsx      # LIFF フロントエンド
├── lib/
│   ├── amidaAlgorithm.ts # あみだロジック
│   ├── supabaseClient.ts # Supabase
│   ├── lineClient.ts     # LINE SDK
│   └── cron.ts           # Cron ジョブ
├── types/
│   ├── index.ts          # メイン型定義
│   └── supabase.ts       # Supabase 型
```

### テスト

```bash
# ユニットテスト
npm test

# ビルド確認
npm run build
```

## ライセンス

MIT License

## お問い合わせ

問題や機能リクエストは、[GitHub Issues](https://github.com/arimonne/line-amidamaru/issues) にお願いします。

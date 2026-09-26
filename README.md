# FLEUR LUMIÈRE

ジルスチュアートのような、花と光をモチーフにした女性向けコスメのデモ EC。  
React + Cloudflare Workers / D1 / R2。カート〜決済の骨格は `EC`（Good Skin.）と同じです。

## ページ

店頭

- `/` トップ
- `/shop` 商品一覧
- `/products/:slug` 商品詳細
- `/about` ブランド
- `/checkout` 購入
- `/checkout/success` 完了

管理

- `/admin` 商品
- `/admin/orders` 注文
- `/admin/customers` 顧客

## 起動

```bash
npm install
npm run db:migrate:local
npm run dev
```

- ストア: [http://localhost:5173](http://localhost:5173)
- 管理: [http://localhost:5173/admin](http://localhost:5173/admin)

本番デプロイ前に D1 / R2 を作成し、`wrangler.jsonc` の ID を差し替えてください。

## 会員登録（Resend テスト）

確認メールは Resend のテスト送信（`onboarding@resend.dev`）です。任意のアドレスには届きません。登録後は画面の案内どおり、同じメールとパスワードでログインへ進んでください。

## Stripe（テスト決済）

チェックアウトから Stripe Checkout へリダイレクトします。テストカードは `ACCT-000015`（有効期限は未来、CVC は任意）です。

Worker には `STRIPE_SECRET_KEY`（テストキー）を入れてください。Webhook は任意で、成功画面が `session_id` から支払いを確認します。

```bash
npx wrangler secret put STRIPE_SECRET_KEY
# 任意
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

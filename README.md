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

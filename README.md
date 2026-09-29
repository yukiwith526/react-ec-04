# FLEUR LUMIÈRE

ジルスチュアート風の、女性向けコスメ・ビューティーのデモ EC 。

## 店頭

![トップ](docs/storefront.jpg)

![商品一覧](docs/shop.jpg)

![商品詳細](docs/product.jpg)

## 管理画面

`/admin`。本番は Cloudflare Access で守ります。

![商品管理](docs/admin-products.png)

![商品編集](docs/admin-product-edit.png)

![注文](docs/admin-orders.png)

![顧客](docs/admin-customers.png)

## 起動

```bash
npm install
npm run db:migrate:local
npm run dev
```

- ストア: [http://localhost:5173](http://localhost:5173)
- 管理: [http://localhost:5173/admin](http://localhost:5173/admin)

## 会員と決済

確認メールはテスト送信なので届きません。画面の案内どおり、同じメールとパスワードでログインしてください。注文履歴はマイページにあります。

支払いは Stripe のテスト決済。秘密キーは `.dev.vars` の `STRIPE_SECRET_KEY` 
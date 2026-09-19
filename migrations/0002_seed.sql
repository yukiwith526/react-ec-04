-- FLEUR LUMIÈRE catalog
INSERT INTO categories (id, label, label_ja, sort_order) VALUES
  ('makeup', 'Makeup', 'メイク', 1),
  ('skincare', 'Skincare', 'スキンケア', 2),
  ('fragrance', 'Fragrance', 'フレグランス', 3),
  ('gift', 'Gift', 'ギフトセット', 4);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p01', 'crystal-bloom-lip-oil', 'CRYSTAL BLOOM LIP OIL', 'クリスタルブルーム リップオイル', 'makeup',
  4180, 80, '花びらのような透明感を唇に。オイルなのにべたつかず、微笑むたび光が残ります。', '水添ポリイソブテン、ホホバ種子油、トコフェロール、香料、赤226', '6.5ml',
  '["うるおいオイル処方","マスクにつきにくい艶","3色展開"]', '["PETAL","ROSE","CORAL"]', 1, 1, 1,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p01-img-1', 'p01', '/products/lip-oil.png', NULL, 0),
  ('p01-img-2', 'p01', '/products/primer-peach.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p02', 'petal-prism-highlighter', 'PETAL PRISM HIGHLIGHTER', 'ペタルプリズム ハイライター', 'makeup',
  4620, 70, '虹色の花びらが頬骨でほどけるハイライター。朝の光を閉じ込めたような繊細な輝きです。', 'マイカ、シリカ、ホホバエステル、トコフェロール', '8g',
  '["微細パール配合","指でもブラシでも","ハイライト＆ボディ"]', '[]', 0, 1, 2,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p02-img-1', 'p02', '/products/highlighter.png', NULL, 0),
  ('p02-img-2', 'p02', '/products/primer-ivory.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p03', 'moonlight-eye-palette', 'MOONLIGHT EYE PALETTE', 'ムーンライト アイパレット', 'makeup',
  6380, 60, '夜明け前の空を9色に分けたアイシャドウ。マットとラスターが、まぶたで花を咲かせます。', 'タルク、マイカ、ジメチコン、トコフェロール', '12g',
  '["マット6色／ラスター3色","ミラー付き","ビルダブル発色"]', '[]', 1, 1, 3,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p03-img-1', 'p03', '/products/palette.png', NULL, 0),
  ('p03-img-2', 'p03', '/products/highlighter.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p04', 'dewy-rose-foundation', 'DEWY ROSE FOUNDATION', 'デューイローズ ファンデーション', 'makeup',
  5280, 90, 'バラの露のような艶を残すリキッドファンデーション。カバーしながらも、素肌に見える仕上がり。', '水、シクロペンタシロキサン、酸化チタン、グリセリン', '30ml',
  '["SPF25 PA++","中カバー","ポンプボトル"]', '[]', 0, 1, 4,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p04-img-1', 'p04', '/products/primer-ivory.png', NULL, 0),
  ('p04-img-2', 'p04', '/products/sponge.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p05', 'silk-veil-primer', 'SILK VEIL PRIMER', 'シルクヴェール プライマー', 'makeup',
  3850, 85, 'シルクのような膜で毛穴をやわらげる下地。ラベンダーピンクの光が、血色をそっと足します。', '水、ジメチコン、マイカ、ナイアシンアミド', '30ml',
  '["ラベンダー補正","メイク持ちアップ","朝のスキンケア後に"]', '[]', 0, 1, 5,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p05-img-1', 'p05', '/products/primer-lilac.png', NULL, 0),
  ('p05-img-2', 'p05', '/products/primer-peach.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p06', 'velvet-lip-rouge', 'VELVET LIP ROUGE', 'ベルベット リップルージュ', 'makeup',
  3520, 100, 'ベルベットのようなマットなのに、乾かないルージュ。花びらを一枚、そっと重ねた発色。', 'ジメチコン、合成ワックス、赤202、トコフェロール', '3.8g',
  '["セミマット","マスクフレンドリー","繰り出し式"]', '["ROSE","BERRY","NUDE"]', 0, 1, 6,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p06-img-1', 'p06', '/products/lipstick.png', NULL, 0),
  ('p06-img-2', 'p06', '/products/lip-oil.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p07', 'pearl-cheek-color', 'PEARL CHEEK COLOR', 'パールチークカラー', 'makeup',
  3960, 75, '真珠層のチーク。指で溶かすと、頬が内側から赤らんだように見えます。', 'マイカ、シリカ、ジメチコン、赤226', '4.5g',
  '["クリーミーパウダー","ハイライト兼用","コンパクト"]', '[]', 0, 1, 7,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p07-img-1', 'p07', '/products/highlighter.png', NULL, 0),
  ('p07-img-2', 'p07', '/products/palette.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p08', 'crystal-nail-color', 'CRYSTAL NAIL COLOR', 'クリスタルネイルカラー', 'makeup',
  1980, 120, 'ガラスの花びらのような透け感ネイル。二度塗りで、指先がジュエリーになります。', '酢酸ブチル、ニトロセルロース、アセチルクエン酸トリブチル', '10ml',
  '["速乾","5フリー処方","グラスボトル"]', '[]', 1, 1, 8,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p08-img-1', 'p08', '/products/nail.png', NULL, 0),
  ('p08-img-2', 'p08', '/products/primer-lilac.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p09', 'rose-dew-mist', 'ROSE DEW MIST', 'ローズデュー ミスト', 'skincare',
  3300, 90, 'ダマスクローズの朝露を閉じ込めたミスト。メイクの上からも、肌をうるおいで包みます。', '水、グリセリン、ダマスクバラ花水、ヒアルロン酸Na', '80ml',
  '["メイクの上からOK","ファインミスト","朝・日中・夜"]', '[]', 1, 1, 9,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p09-img-1', 'p09', '/products/mist.png', NULL, 0),
  ('p09-img-2', 'p09', '/products/perfume.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p10', 'petal-night-cream', 'PETAL NIGHT CREAM', 'ペタル ナイトクリーム', 'skincare',
  4840, 70, '花びらをすりつぶしたような濃密クリーム。眠っているあいだに、肌のキメをやわらかく整えます。', '水、シア脂、グリセリン、セラミドNP、ダマスクバラ花油', '45g',
  '["夜専用","リッチテクスチャー","ローズの香り"]', '[]', 0, 1, 10,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p10-img-1', 'p10', '/products/cream.png', NULL, 0),
  ('p10-img-2', 'p10', '/products/sheet-mask.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p11', 'moon-petal-eau', 'MOON PETAL EAU DE TOILETTE', 'ムーンペタル オードトワレ', 'fragrance',
  8800, 50, '夜にほころぶ花の香り。トップはペアー、ハートはピオニー、ベースはムスクのやわらかな残香。', 'エタノール、香料、水', '50ml',
  '["オードトワレ","持続 6〜8時間","グラスボトル"]', '["PEONY","MAGNOLIA","PEAR"]', 1, 1, 11,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p11-img-1', 'p11', '/products/perfume.png', NULL, 0),
  ('p11-img-2', 'p11', '/products/mist.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p12', 'bloom-hair-mist', 'BLOOM HAIR MIST', 'ブルーム ヘアミスト', 'fragrance',
  4180, 80, '髪にひと吹きする花のベール。歩くたび、やわらかい香りが残ります。', '水、エタノール、グリセリン、香料', '50ml',
  '["洗い流さない","静電気ケア","ノンシリコン"]', '["ROSE","PEONY"]', 0, 1, 12,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p12-img-1', 'p12', '/products/mist.png', NULL, 0),
  ('p12-img-2', 'p12', '/products/perfume.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p13', 'petal-holiday-coffret', 'PETAL HOLIDAY COFFRET', 'ペタル ホリデーコフレ', 'gift',
  12100, 40, 'リップオイル、チーク、ミストを花束のようにまとめた限定コフレ。ギフトボックス付き。', '各同梱品の成分表示をご確認ください', '3点セット',
  '["ギフトボックス付","数量限定","リボン付き"]', '[]', 1, 1, 13,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p13-img-1', 'p13', '/products/gift-set.png', NULL, 0),
  ('p13-img-2', 'p13', '/products/sheet-mask.png', NULL, 1);

INSERT INTO products (
  id, slug, name, name_ja, category_id, price, stock, description, ingredients, size,
  details_json, scents_json, is_new, is_published, sort_order, created_at, updated_at
) VALUES (
  'p14', 'mini-lip-atelier', 'MINI LIP ATELIER', 'ミニリップ アトリエ', 'gift',
  6600, 55, 'リップオイル3色を小さなアトリエに。ポーチに忍ばせて、気分で色を選べます。', '各同梱品の成分表示をご確認ください', '3色セット',
  '["ミニサイズ3本","ポーチ付き","ギフト向け"]', '[]', 0, 1, 14,
  '2026-09-18T00:00:00.000Z', '2026-09-18T00:00:00.000Z'
);
INSERT INTO product_images (id, product_id, url, r2_key, sort_order) VALUES
  ('p14-img-1', 'p14', '/products/gift-set.png', NULL, 0),
  ('p14-img-2', 'p14', '/products/lipstick.png', NULL, 1);

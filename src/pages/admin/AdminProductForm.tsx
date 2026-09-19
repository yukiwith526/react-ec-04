import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categories } from '../../data/storefront'
import {
  createAdminProduct,
  deleteAdminImage,
  fetchAdminProduct,
  unpublishAdminProduct,
  updateAdminProduct,
  uploadAdminImage,
  type ProductPayload,
} from '../../lib/api'
import { useCatalog } from '../../context/CatalogContext'
import type { AdminProduct, Category } from '../../types'

const empty: ProductPayload = {
  slug: '',
  name: '',
  nameJa: '',
  category: 'makeup',
  price: 0,
  stock: 0,
  description: '',
  ingredients: '',
  size: '',
  details: [''],
  scents: [],
  isNew: false,
  isPublished: true,
}

function toPayload(product: AdminProduct): ProductPayload {
  return {
    slug: product.slug,
    name: product.name,
    nameJa: product.nameJa,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description,
    ingredients: product.ingredients,
    size: product.size,
    details: product.details.length ? product.details : [''],
    scents: product.scents ?? [],
    isNew: Boolean(product.isNew),
    isPublished: product.isPublished,
  }
}

export function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reload } = useCatalog()
  const [form, setForm] = useState<ProductPayload>(empty)
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const isNew = !id

  useEffect(() => {
    if (!id) {
      setForm(empty)
      setProduct(null)
      return
    }
    fetchAdminProduct(id)
      .then((data) => {
        setProduct(data)
        setForm(toPayload(data))
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '読み込みに失敗しました'))
  }, [id])

  const set = <K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      ...form,
      details: form.details.map((item) => item.trim()).filter(Boolean),
      scents: form.scents.map((item) => item.trim()).filter(Boolean),
    }
    try {
      const saved = id ? await updateAdminProduct(id, payload) : await createAdminProduct(payload)
      reload()
      navigate(`/admin/products/${saved.id}`)
      setProduct(saved)
      setForm(toPayload(saved))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (file: File) => {
    if (!product) return
    try {
      const saved = await uploadAdminImage(product.id, file)
      setProduct(saved)
      reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    }
  }

  const onRemoveImage = async (imageId: string) => {
    if (!product) return
    const saved = await deleteAdminImage(product.id, imageId)
    setProduct(saved)
    reload()
  }

  const hide = async () => {
    if (!product || !confirm('この商品を非公開にしますか？')) return
    const saved = await unpublishAdminProduct(product.id)
    setProduct(saved)
    setForm(toPayload(saved))
    reload()
  }

  return (
    <section className="admin__page">
      <header className="admin__head">
        <div>
          <p className="kicker">ADMIN</p>
          <h1>{isNew ? '商品を追加' : '商品を編集'}</h1>
        </div>
        <Link to="/admin" className="text-btn">
          一覧へ
        </Link>
      </header>
      {error && <p className="empty">{error}</p>}
      <form className="admin__form" onSubmit={(event) => void submit(event)}>
        <label>
          英名
          <input value={form.name} onChange={(event) => set('name', event.target.value)} required />
        </label>
        <label>
          日本語名
          <input value={form.nameJa} onChange={(event) => set('nameJa', event.target.value)} required />
        </label>
        <label>
          slug
          <input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="空なら英名から生成" />
        </label>
        <label>
          カテゴリ
          <select
            value={form.category}
            onChange={(event) => set('category', event.target.value as Category)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.labelJa}
              </option>
            ))}
          </select>
        </label>
        <label>
          価格（整数・円）
          <input
            type="number"
            min={0}
            step={1}
            value={form.price}
            onChange={(event) => set('price', Number(event.target.value))}
            required
          />
        </label>
        <label>
          在庫（0以上）
          <input
            type="number"
            min={0}
            step={1}
            value={form.stock}
            onChange={(event) => set('stock', Number(event.target.value))}
            required
          />
        </label>
        <label>
          容量
          <input value={form.size} onChange={(event) => set('size', event.target.value)} />
        </label>
        <label className="admin__full">
          説明
          <textarea value={form.description} onChange={(event) => set('description', event.target.value)} rows={4} />
        </label>
        <label className="admin__full">
          成分
          <textarea value={form.ingredients} onChange={(event) => set('ingredients', event.target.value)} rows={3} />
        </label>
        <label className="admin__full">
          特長（改行区切り）
          <textarea
            value={form.details.join('\n')}
            onChange={(event) => set('details', event.target.value.split('\n'))}
            rows={4}
          />
        </label>
        <label className="admin__full">
          香り（カンマ区切り・カラー名）
          <input
            value={form.scents.join(', ')}
            onChange={(event) => set('scents', event.target.value.split(','))}
            placeholder="ROSE, PEONY"
          />
        </label>
        <label className="admin__check">
          <input type="checkbox" checked={form.isNew} onChange={(event) => set('isNew', event.target.checked)} />
          NEW バッジ
        </label>
        <label className="admin__check">
          <input type="checkbox" checked={form.isPublished} onChange={(event) => set('isPublished', event.target.checked)} />
          公開する
        </label>
        <div className="admin__form-actions">
          <button type="submit" className="btn btn--teal" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          {product?.isPublished && (
            <button type="button" className="text-btn" onClick={() => void hide()}>
              非公開にする
            </button>
          )}
        </div>
      </form>

      {product && (
        <section className="admin__images">
          <h2>画像</h2>
          <p className="muted">既存の Unsplash URL はそのまま使えます。新規アップロードは R2 に保存されます。</p>
          <div className="admin__image-grid">
            {product.imageRecords.map((image) => (
              <figure key={image.id}>
                <img src={image.url} alt="" />
                <figcaption>{image.r2_key ? 'R2' : 'Unsplash'}</figcaption>
                <button type="button" className="text-btn" onClick={() => void onRemoveImage(image.id)}>
                  削除
                </button>
              </figure>
            ))}
          </div>
          <label className="btn btn--outline-sm admin__upload">
            画像をアップロード
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onUpload(file)
                event.currentTarget.value = ''
              }}
            />
          </label>
        </section>
      )}
    </section>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Grid2X2,
  PanelLeft,
  X,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Product, Category, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface ProductsViewProps {
  products: Product[]
  categories: Category[]
  query: string
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)

const emptyProduct = {
  product_name: '',
  category_id: '',
  brand: '',
  price: '',
  stock_quantity: '0',
  warranty_months: '12',
}

export default function ProductsView({
  products,
  categories,
  query,
  onRefresh,
  showToast,
}: ProductsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Category Map
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((c) => map.set(c.category_id, c.category_name))
    return map
  }, [categories])

  // Filtered Products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Search
      const searchStr = `${p.product_name} ${p.brand || ''} ${categoryMap.get(p.category_id) || ''}`.toLowerCase()
      if (query && !searchStr.includes(query.toLowerCase())) return false

      // Category filter
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false

      // Stock filter
      if (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false
      if (stockFilter === 'low_stock' && (p.stock_quantity <= 0 || p.stock_quantity > 5)) return false
      if (stockFilter === 'out_of_stock' && p.stock_quantity !== 0) return false

      return true
    })
  }, [products, query, selectedCategory, stockFilter, categoryMap])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      ...emptyProduct,
      category_id: categories.length ? String(categories[0].category_id) : '',
    })
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingId(p.product_id)
    setFormData({
      product_name: p.product_name,
      category_id: String(p.category_id),
      brand: p.brand || '',
      price: String(p.price),
      stock_quantity: String(p.stock_quantity),
      warranty_months: String(p.warranty_months),
    })
    setModalOpen(true)
  }

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_name.trim()) {
      showToast('Product name is required', 'error')
      return
    }
    if (!formData.category_id) {
      showToast('Please select a category', 'error')
      return
    }
    if (Number(formData.price) < 0 || isNaN(Number(formData.price))) {
      showToast('Price must be a valid positive number', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        product_name: formData.product_name.trim(),
        category_id: Number(formData.category_id),
        brand: formData.brand.trim() || null,
        price: Number(formData.price),
        stock_quantity: Number(formData.stock_quantity) || 0,
        warranty_months: Number(formData.warranty_months) || 0,
      }

      if (editingId !== null) {
        await api.put(`/products/${editingId}`, payload)
        showToast('Product updated successfully!', 'success')
      } else {
        await api.post('/products', payload)
        showToast('Product added successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Delete action
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/products/${deleteTarget.product_id}`)
      showToast(`Product "${deleteTarget.product_name}" deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> INVENTORY MANAGEMENT
          </div>
          <h1>
            Product <em>Catalogue</em>
          </h1>
          <p>Browse, add, edit, and manage all electronic products in stock.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="content-card products-card">
        {/* Card Header & Tools */}
        <div className="card-heading flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h2>
              All Products <span>{filtered.length} of {products.length}</span>
            </h2>
            <p>Full real-time catalog from MySQL database</p>
          </div>

          <div className="table-tools flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={viewMode === 'table' ? 'selected' : ''}
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <PanelLeft className="w-3.5 h-3.5" />
              </button>
              <button
                className={viewMode === 'grid' ? 'selected' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Filter Chips */}
        <div className="filter-row flex gap-2">
          <button
            className={`filter-chip ${stockFilter === 'all' ? 'selected' : ''}`}
            onClick={() => setStockFilter('all')}
          >
            All Products <span>{products.length}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'in_stock' ? 'selected' : ''}`}
            onClick={() => setStockFilter('in_stock')}
          >
            In Stock <span>{products.filter((p) => p.stock_quantity > 0).length}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'low_stock' ? 'selected' : ''}`}
            onClick={() => setStockFilter('low_stock')}
          >
            Low Stock (≤5) <span>{products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'out_of_stock' ? 'selected' : ''}`}
            onClick={() => setStockFilter('out_of_stock')}
          >
            Out of Stock <span>{products.filter((p) => p.stock_quantity === 0).length}</span>
          </button>
        </div>

        {/* Products Table or Grid View */}
        {viewMode === 'table' ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PRODUCT NAME</th>
                  <th>CATEGORY</th>
                  <th>BRAND</th>
                  <th>PRICE</th>
                  <th>STOCK STATUS</th>
                  <th>WARRANTY</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const stockStatus =
                    product.stock_quantity <= 0
                      ? 'low'
                      : product.stock_quantity <= 5
                      ? 'medium'
                      : 'high'

                  return (
                    <tr key={product.product_id} className="product-row">
                      <td className="font-mono text-muted text-xs">
                        #{product.product_id}
                      </td>
                      <td>
                        <div className="product-name">
                          <div className="product-avatar avatar-blue">
                            <Laptop />
                          </div>
                          <div>
                            <b className="text-white">{product.product_name}</b>
                            <small className="text-muted">SKU #{product.product_id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-pill category-laptop">
                          {categoryMap.get(product.category_id) || `Cat #${product.category_id}`}
                        </span>
                      </td>
                      <td className="text-muted">{product.brand || '—'}</td>
                      <td>
                        <strong className="text-white">
                          {formatCurrency(product.price)}
                        </strong>
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus}`}>
                          {stockStatus === 'low' && <i />}
                          {product.stock_quantity} units
                        </span>
                      </td>
                      <td className="text-muted text-xs">
                        {product.warranty_months} {product.warranty_months === 1 ? 'Month' : 'Months'}
                      </td>
                      <td>
                        <div className="row-actions-wrap">
                          <button
                            className="action-btn edit"
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteTarget(product)}
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted text-sm">
                      No products found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="product-grid">
            {filtered.map((p) => (
              <div key={p.product_id} className="mini-product relative group">
                <div className="flex items-center justify-between w-full">
                  <div className="product-avatar avatar-blue">
                    <Laptop />
                  </div>
                  <span className="text-[10px] text-muted font-mono">#{p.product_id}</span>
                </div>
                <b className="text-sm text-white line-clamp-1">{p.product_name}</b>
                <span className="text-xs text-muted">
                  {categoryMap.get(p.category_id)} · {p.brand || 'Brand'}
                </span>
                <strong className="text-sm text-cyan-300">{formatCurrency(p.price)}</strong>
                <div className="flex items-center justify-between w-full pt-2 border-t border-white/5">
                  <span className={`stock-badge ${p.stock_quantity <= 5 ? 'low' : 'high'}`}>
                    {p.stock_quantity} in stock
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 rounded hover:bg-white/10 text-muted hover:text-white"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1 rounded hover:bg-rose-500/20 text-muted hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card Footer */}
        <div className="card-footer">
          <span>
            Showing <b>{filtered.length}</b> products
          </span>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Product' : 'Add New Product'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Product Name */}
                  <div className="form-group full">
                    <label className="form-label">Product Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Sony Bravia 55' 4K OLED TV"
                      value={formData.product_name}
                      onChange={(e) =>
                        setFormData({ ...formData, product_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({ ...formData, category_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Sony, Apple, Samsung"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    />
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div className="form-group">
                    <label className="form-label">Initial Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_quantity: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Warranty Months */}
                  <div className="form-group full">
                    <label className="form-label">Warranty Period (Months) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="12"
                      value={formData.warranty_months}
                      onChange={(e) =>
                        setFormData({ ...formData, warranty_months: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="outline-button"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="gradient-button">
                  {saving
                    ? 'Saving...'
                    : editingId !== null
                    ? 'Update Product'
                    : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteTarget?.product_name}" (ID #${deleteTarget?.product_id})? This action cannot be undone.`}
        confirmText="Delete Product"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

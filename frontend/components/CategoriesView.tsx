'use client'

import React, { useState, useMemo } from 'react'
import { Tags, Plus, Pencil, Trash2, X, FolderTree, Package } from 'lucide-react'
import { Category, Product, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface CategoriesViewProps {
  categories: Category[]
  products: Product[]
  query: string
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export default function CategoriesView({
  categories,
  products,
  query,
  onRefresh,
  showToast,
}: CategoriesViewProps) {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Map of category product counts
  const productCountMap = useMemo(() => {
    const counts = new Map<number, number>()
    products.forEach((p) => {
      counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1)
    })
    return counts
  }, [products])

  // Filter
  const filtered = useMemo(() => {
    return categories.filter((c) =>
      c.category_name.toLowerCase().includes(query.toLowerCase())
    )
  }, [categories, query])

  const handleOpenCreate = () => {
    setEditingId(null)
    setCategoryName('')
    setModalOpen(true)
  }

  const handleOpenEdit = (c: Category) => {
    setEditingId(c.category_id)
    setCategoryName(c.category_name)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) {
      showToast('Category name cannot be empty', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingId !== null) {
        await api.put(`/categories/${editingId}`, {
          category_name: categoryName.trim(),
        })
        showToast('Category updated successfully!', 'success')
      } else {
        await api.post('/categories', {
          category_name: categoryName.trim(),
        })
        showToast('Category created successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/categories/${deleteTarget.category_id}`)
      showToast(`Category "${deleteTarget.category_name}" deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete category (used by products)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> PRODUCT CATALOG HIERARCHY
          </div>
          <h1>
            Store <em>Categories</em>
          </h1>
          <p>Organize products into logical categories for smooth store navigation.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Categories <span>{filtered.length} total</span>
            </h2>
            <p>Active product grouping departments</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>CATEGORY NAME</th>
                <th>LINKED PRODUCTS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => {
                const count = productCountMap.get(cat.category_id) || 0
                return (
                  <tr key={cat.category_id} className="product-row">
                    <td className="font-mono text-muted text-xs">#{cat.category_id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
                          <Tags className="w-4 h-4" />
                        </div>
                        <b className="text-white text-sm">{cat.category_name}</b>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-pink">
                        <Package className="w-3 h-3" /> {count} products
                      </span>
                    </td>
                    <td>
                      <div className="row-actions-wrap">
                        <button
                          className="action-btn edit"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setDeleteTarget(cat)}
                          title="Delete Category"
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
                  <td colSpan={4} className="text-center py-10 text-muted text-xs">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Categories: <b>{categories.length}</b>
          </span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Category' : 'Add Category'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Smart Watches, Audio & Sound"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    autoFocus
                  />
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
                    ? 'Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteTarget?.category_name}"? If there are products associated with this category, the database will prevent deletion.`}
        confirmText="Delete Category"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

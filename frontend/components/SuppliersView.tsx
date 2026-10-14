'use client'

import React, { useState, useMemo } from 'react'
import { Truck, Plus, Pencil, Trash2, X, Mail, Phone, MapPin } from 'lucide-react'
import { Supplier, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface SuppliersViewProps {
  suppliers: Supplier[]
  query: string
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const emptySupplier = {
  supplier_name: '',
  phone: '',
  email: '',
  address: '',
}

export default function SuppliersView({
  suppliers,
  query,
  onRefresh,
  showToast,
}: SuppliersViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptySupplier)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    return suppliers.filter((s) =>
      `${s.supplier_name} ${s.phone || ''} ${s.email || ''} ${s.address || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [suppliers, query])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(emptySupplier)
    setModalOpen(true)
  }

  const handleOpenEdit = (s: Supplier) => {
    setEditingId(s.supplier_id)
    setForm({
      supplier_name: s.supplier_name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplier_name.trim()) {
      showToast('Supplier name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        supplier_name: form.supplier_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      }

      if (editingId !== null) {
        await api.put(`/suppliers/${editingId}`, payload)
        showToast('Supplier updated successfully!', 'success')
      } else {
        await api.post('/suppliers', payload)
        showToast('Supplier added successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/suppliers/${deleteTarget.supplier_id}`)
      showToast(`Supplier "${deleteTarget.supplier_name}" deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete supplier (linked to purchases)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> SUPPLY CHAIN & VENDORS
          </div>
          <h1>
            Store <em>Suppliers</em>
          </h1>
          <p>Manage hardware vendors, distributors, and procurement partners.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Suppliers <span>{filtered.length} of {suppliers.length}</span>
            </h2>
            <p>Active vendor database from MySQL</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>SUPPLIER NAME</th>
                <th>PHONE NUMBER</th>
                <th>EMAIL ADDRESS</th>
                <th>BUSINESS ADDRESS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.supplier_id} className="product-row">
                  <td className="font-mono text-muted text-xs">#{s.supplier_id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <b className="text-white text-sm">{s.supplier_name}</b>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>{s.phone || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      <span>{s.email || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted max-w-xs truncate">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate">{s.address || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions-wrap">
                      <button
                        className="action-btn edit"
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Supplier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteTarget(s)}
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted text-xs">
                    No suppliers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Suppliers: <b>{suppliers.length}</b>
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Supplier' : 'Add New Supplier'}</h3>
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
                  <label className="form-label">Supplier / Company Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Apex Electronics Distributing"
                    value={form.supplier_name}
                    onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. +91 99887 76655"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. vendor@apexelec.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Office / Warehouse Address</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="e.g. Industrial Area Phase 2, Pune"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                    ? 'Update Supplier'
                    : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${deleteTarget?.supplier_name}"? If there are existing purchase records from this supplier, the database will protect existing purchase history.`}
        confirmText="Delete Supplier"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

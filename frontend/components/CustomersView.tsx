'use client'

import React, { useState, useMemo } from 'react'
import { Users, Plus, Pencil, Trash2, X, Mail, Phone, MapPin } from 'lucide-react'
import { Customer, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface CustomersViewProps {
  customers: Customer[]
  query: string
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const emptyCustomer = {
  customer_name: '',
  phone: '',
  email: '',
  address: '',
}

export default function CustomersView({
  customers,
  query,
  onRefresh,
  showToast,
}: CustomersViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyCustomer)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      `${c.customer_name} ${c.phone || ''} ${c.email || ''} ${c.address || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [customers, query])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(emptyCustomer)
    setModalOpen(true)
  }

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.customer_id)
    setForm({
      customer_name: c.customer_name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name.trim()) {
      showToast('Customer name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      }

      if (editingId !== null) {
        await api.put(`/customers/${editingId}`, payload)
        showToast('Customer updated successfully!', 'success')
      } else {
        await api.post('/customers', payload)
        showToast('Customer added successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/customers/${deleteTarget.customer_id}`)
      showToast(`Customer "${deleteTarget.customer_name}" deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete customer (linked to sales)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> CLIENT DIRECTORY
          </div>
          <h1>
            Store <em>Customers</em>
          </h1>
          <p>Maintain contact records, purchase histories, and client profiles.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Customers <span>{filtered.length} of {customers.length}</span>
            </h2>
            <p>Registered customer accounts from MySQL</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>CUSTOMER NAME</th>
                <th>PHONE NUMBER</th>
                <th>EMAIL ADDRESS</th>
                <th>PHYSICAL ADDRESS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.customer_id} className="product-row">
                  <td className="font-mono text-muted text-xs">#{c.customer_id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                        {c.customer_name.slice(0, 2).toUpperCase()}
                      </div>
                      <b className="text-white text-sm">{c.customer_name}</b>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>{c.phone || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      <span>{c.email || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted max-w-xs truncate">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate">{c.address || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions-wrap">
                      <button
                        className="action-btn edit"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Customer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete Customer"
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
                    No customers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Customers: <b>{customers.length}</b>
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Customer' : 'Add New Customer'}</h3>
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
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rahul@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="e.g. 45 MG Road, Bangalore, Karnataka"
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
                    ? 'Update Customer'
                    : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.customer_name}"? If this customer has existing sales records, the database will preserve data integrity by preventing deletion.`}
        confirmText="Delete Customer"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

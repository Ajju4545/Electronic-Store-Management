'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingBag, Plus, Pencil, Trash2, X, Eye, Truck, User, Calendar, IndianRupee } from 'lucide-react'
import { Purchase, PurchaseDetails, Supplier, Employee, Product, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface PurchasesViewProps {
  purchases: Purchase[]
  suppliers: Supplier[]
  employees: Employee[]
  products: Product[]
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

const todayStr = new Date().toISOString().split('T')[0]

const emptyPurchase = {
  supplier_id: '',
  employee_id: '',
  purchase_date: todayStr,
  total_cost: '',
}

export default function PurchasesView({
  purchases,
  suppliers,
  employees,
  products,
  query,
  onRefresh,
  showToast,
}: PurchasesViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyPurchase)
  const [saving, setSaving] = useState(false)

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Maps
  const supplierMap = useMemo(() => {
    const map = new Map<number, string>()
    suppliers.forEach((s) => map.set(s.supplier_id, s.supplier_name))
    return map
  }, [suppliers])

  const employeeMap = useMemo(() => {
    const map = new Map<number, string>()
    employees.forEach((e) => map.set(e.employee_id, e.employee_name))
    return map
  }, [employees])

  const productMap = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((p) => map.set(p.product_id, p.product_name))
    return map
  }, [products])

  // Filter
  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      const sup = supplierMap.get(p.supplier_id) || ''
      const emp = employeeMap.get(p.employee_id) || ''
      const searchStr = `${p.purchase_id} ${sup} ${emp} ${p.purchase_date} ${p.total_cost}`.toLowerCase()
      return !query || searchStr.includes(query.toLowerCase())
    })
  }, [purchases, query, supplierMap, employeeMap])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({
      supplier_id: suppliers.length ? String(suppliers[0].supplier_id) : '',
      employee_id: employees.length ? String(employees[0].employee_id) : '',
      purchase_date: todayStr,
      total_cost: '',
    })
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: Purchase) => {
    setEditingId(p.purchase_id)
    setForm({
      supplier_id: String(p.supplier_id),
      employee_id: String(p.employee_id),
      purchase_date: p.purchase_date,
      total_cost: String(p.total_cost),
    })
    setModalOpen(true)
  }

  // View Details
  const handleViewDetails = async (p: Purchase) => {
    setSelectedPurchase(p)
    setDetailsModalOpen(true)
    setLoadingDetails(true)
    try {
      const details = await api.get<PurchaseDetails[]>(
        `/purchase-details?purchase_id=${p.purchase_id}`
      )
      setPurchaseDetails(details || [])
    } catch (err: any) {
      showToast(err.message || 'Could not load purchase details', 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplier_id) {
      showToast('Supplier is required', 'error')
      return
    }
    if (!form.employee_id) {
      showToast('Employee is required', 'error')
      return
    }
    if (!form.purchase_date) {
      showToast('Purchase date is required', 'error')
      return
    }
    if (Number(form.total_cost) < 0 || isNaN(Number(form.total_cost))) {
      showToast('Total cost must be a valid positive number', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        supplier_id: Number(form.supplier_id),
        employee_id: Number(form.employee_id),
        purchase_date: form.purchase_date,
        total_cost: Number(form.total_cost),
      }

      if (editingId !== null) {
        await api.put(`/purchases/${editingId}`, payload)
        showToast('Purchase record updated successfully!', 'success')
      } else {
        await api.post('/purchases', payload)
        showToast('Purchase order created successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/purchases/${deleteTarget.purchase_id}`)
      showToast(`Purchase order #${deleteTarget.purchase_id} deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete purchase with line items', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> PROCUREMENT & SUPPLY
          </div>
          <h1>
            Store <em>Purchases</em>
          </h1>
          <p>Track wholesale stock procurement orders and vendor invoices.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Create Purchase
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Purchases <span>{filtered.length} of {purchases.length}</span>
            </h2>
            <p>Purchase invoices recorded in MySQL</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>INVOICE ID</th>
                <th>SUPPLIER / VENDOR</th>
                <th>PURCHASE DATE</th>
                <th>AUTHORIZED BY</th>
                <th>TOTAL COST</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const supplierName = supplierMap.get(p.supplier_id) || `Vendor #${p.supplier_id}`
                const employeeName = employeeMap.get(p.employee_id) || `Staff #${p.employee_id}`

                return (
                  <tr key={p.purchase_id} className="product-row">
                    <td className="font-mono text-muted text-xs">
                      #{p.purchase_id}
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <b className="text-white text-xs">{supplierName}</b>
                          <small className="text-muted block text-[10px]">
                            ID #{p.supplier_id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span>{p.purchase_date}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <User className="w-3.5 h-3.5 text-muted" />
                        <span>{employeeName}</span>
                      </div>
                    </td>
                    <td>
                      <strong className="text-amber-400 font-bold text-xs">
                        {formatCurrency(p.total_cost)}
                      </strong>
                    </td>
                    <td>
                      <div className="row-actions-wrap">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewDetails(p)}
                          title="View Purchase Items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Purchase"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete Purchase"
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
                  <td colSpan={6} className="text-center py-10 text-muted text-xs">
                    No purchase orders found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Purchases: <b>{purchases.length}</b>
          </span>
        </div>
      </div>

      {/* Create / Edit Purchase Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Purchase Order' : 'Create Purchase Order'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div className="form-grid">
                  {/* Supplier Select */}
                  <div className="form-group">
                    <label className="form-label">Select Supplier *</label>
                    <select
                      className="form-select"
                      value={form.supplier_id}
                      onChange={(e) =>
                        setForm({ ...form, supplier_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Choose Supplier...</option>
                      {suppliers.map((s) => (
                        <option key={s.supplier_id} value={s.supplier_id}>
                          #{s.supplier_id} — {s.supplier_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Select */}
                  <div className="form-group">
                    <label className="form-label">Authorized Employee *</label>
                    <select
                      className="form-select"
                      value={form.employee_id}
                      onChange={(e) =>
                        setForm({ ...form, employee_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Choose Employee...</option>
                      {employees.map((e) => (
                        <option key={e.employee_id} value={e.employee_id}>
                          #{e.employee_id} — {e.employee_name} ({e.role || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div className="form-group">
                    <label className="form-label">Purchase Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.purchase_date}
                      onChange={(e) =>
                        setForm({ ...form, purchase_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Total Cost */}
                  <div className="form-group">
                    <label className="form-label">Total Cost (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={form.total_cost}
                      onChange={(e) =>
                        setForm({ ...form, total_cost: e.target.value })
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
                    ? 'Update Purchase'
                    : 'Create Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {detailsModalOpen && selectedPurchase && (
        <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Purchase Order Items — #{selectedPurchase.purchase_id}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Supplier: {supplierMap.get(selectedPurchase.supplier_id)} • Date: {selectedPurchase.purchase_date}
                </p>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <p className="text-xs text-muted text-center py-8">Loading line items...</p>
              ) : purchaseDetails.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ITEM ID</th>
                        <th>PRODUCT NAME</th>
                        <th>QUANTITY</th>
                        <th>UNIT COST</th>
                        <th className="text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseDetails.map((item) => {
                        const name =
                          item.product_name ||
                          productMap.get(item.product_id) ||
                          `Product #${item.product_id}`
                        const lineTotal = item.quantity * item.unit_cost

                        return (
                          <tr key={item.purchase_detail_id}>
                            <td className="font-mono text-muted text-xs">
                              #{item.purchase_detail_id}
                            </td>
                            <td className="font-bold text-white text-xs">{name}</td>
                            <td className="text-muted text-xs">{item.quantity} units</td>
                            <td className="text-muted text-xs">
                              {formatCurrency(item.unit_cost)}
                            </td>
                            <td className="font-bold text-amber-400 text-xs text-right">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-8">
                  No individual line item details recorded for this purchase order.
                </p>
              )}

              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center text-xs">
                <span className="text-muted">Total Invoice Value:</span>
                <span className="font-bold text-sm text-amber-400">
                  {formatCurrency(selectedPurchase.total_cost)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="outline-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete Purchase Order #${deleteTarget?.purchase_id}? Associated item details will also be checked by the database.`}
        confirmText="Delete Purchase"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

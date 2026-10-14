'use client'

import React, { useState, useMemo } from 'react'
import { CircleDollarSign, Plus, Pencil, Trash2, X, Eye, Users, User, Calendar, CreditCard } from 'lucide-react'
import { Sale, SaleDetails, Customer, Employee, Product, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface SalesViewProps {
  sales: Sale[]
  customers: Customer[]
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

const emptySale = {
  customer_id: '',
  employee_id: '',
  sale_date: todayStr,
  total_amount: '',
  payment_method: 'Cash',
}

export default function SalesView({
  sales,
  customers,
  employees,
  products,
  query,
  onRefresh,
  showToast,
}: SalesViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptySale)
  const [saving, setSaving] = useState(false)

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [saleDetails, setSaleDetails] = useState<SaleDetails[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Maps
  const customerMap = useMemo(() => {
    const map = new Map<number, string>()
    customers.forEach((c) => map.set(c.customer_id, c.customer_name))
    return map
  }, [customers])

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
    return sales.filter((s) => {
      const cust = customerMap.get(s.customer_id) || ''
      const emp = employeeMap.get(s.employee_id) || ''
      const searchStr = `${s.sale_id} ${cust} ${emp} ${s.sale_date} ${s.total_amount} ${s.payment_method || ''}`.toLowerCase()
      return !query || searchStr.includes(query.toLowerCase())
    })
  }, [sales, query, customerMap, employeeMap])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({
      customer_id: customers.length ? String(customers[0].customer_id) : '',
      employee_id: employees.length ? String(employees[0].employee_id) : '',
      sale_date: todayStr,
      total_amount: '',
      payment_method: 'Cash',
    })
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (s: Sale) => {
    setEditingId(s.sale_id)
    setForm({
      customer_id: String(s.customer_id),
      employee_id: String(s.employee_id),
      sale_date: s.sale_date,
      total_amount: String(s.total_amount),
      payment_method: s.payment_method || 'Cash',
    })
    setModalOpen(true)
  }

  // View Details
  const handleViewDetails = async (s: Sale) => {
    setSelectedSale(s)
    setDetailsModalOpen(true)
    setLoadingDetails(true)
    try {
      const details = await api.get<SaleDetails[]>(
        `/sale-details?sale_id=${s.sale_id}`
      )
      setSaleDetails(details || [])
    } catch (err: any) {
      showToast(err.message || 'Could not load sale details', 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_id) {
      showToast('Customer is required', 'error')
      return
    }
    if (!form.employee_id) {
      showToast('Employee is required', 'error')
      return
    }
    if (!form.sale_date) {
      showToast('Sale date is required', 'error')
      return
    }
    if (Number(form.total_amount) < 0 || isNaN(Number(form.total_amount))) {
      showToast('Total amount must be a valid positive number', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        customer_id: Number(form.customer_id),
        employee_id: Number(form.employee_id),
        sale_date: form.sale_date,
        total_amount: Number(form.total_amount),
        payment_method: form.payment_method,
      }

      if (editingId !== null) {
        await api.put(`/sales/${editingId}`, payload)
        showToast('Sale record updated successfully!', 'success')
      } else {
        await api.post('/sales', payload)
        showToast('Sale transaction recorded successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save sale', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/sales/${deleteTarget.sale_id}`)
      showToast(`Sale #${deleteTarget.sale_id} deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete sale with line items', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> POINT OF SALE & REVENUE
          </div>
          <h1>
            Store <em>Sales</em>
          </h1>
          <p>Customer billing, checkout registers, and sales receipts.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> New Sale Receipt
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Sales Receipts <span>{filtered.length} of {sales.length}</span>
            </h2>
            <p>Customer sales transactions stored in MySQL</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RECEIPT ID</th>
                <th>CUSTOMER NAME</th>
                <th>SALE DATE</th>
                <th>SALES EXECUTIVE</th>
                <th>PAYMENT METHOD</th>
                <th>AMOUNT PAID</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const customerName = customerMap.get(s.customer_id) || `Customer #${s.customer_id}`
                const employeeName = employeeMap.get(s.employee_id) || `Staff #${s.employee_id}`

                return (
                  <tr key={s.sale_id} className="product-row">
                    <td className="font-mono text-muted text-xs">
                      #{s.sale_id}
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <b className="text-white text-xs">{customerName}</b>
                          <small className="text-muted block text-[10px]">
                            ID #{s.customer_id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span>{s.sale_date}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <User className="w-3.5 h-3.5 text-muted" />
                        <span>{employeeName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        <CreditCard className="w-3 h-3" />
                        {s.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td>
                      <strong className="text-emerald-400 font-bold text-xs">
                        {formatCurrency(s.total_amount)}
                      </strong>
                    </td>
                    <td>
                      <div className="row-actions-wrap">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewDetails(s)}
                          title="View Sale Items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Sale"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete Sale"
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
                  <td colSpan={7} className="text-center py-10 text-muted text-xs">
                    No sales receipts found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Sales: <b>{sales.length}</b>
          </span>
        </div>
      </div>

      {/* Create / Edit Sale Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Sale Transaction' : 'Record New Sale'}</h3>
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
                  {/* Customer Select */}
                  <div className="form-group">
                    <label className="form-label">Customer *</label>
                    <select
                      className="form-select"
                      value={form.customer_id}
                      onChange={(e) =>
                        setForm({ ...form, customer_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c) => (
                        <option key={c.customer_id} value={c.customer_id}>
                          #{c.customer_id} — {c.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Select */}
                  <div className="form-group">
                    <label className="form-label">Sales Representative *</label>
                    <select
                      className="form-select"
                      value={form.employee_id}
                      onChange={(e) =>
                        setForm({ ...form, employee_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Employee...</option>
                      {employees.map((e) => (
                        <option key={e.employee_id} value={e.employee_id}>
                          #{e.employee_id} — {e.employee_name} ({e.role || 'Sales'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sale Date */}
                  <div className="form-group">
                    <label className="form-label">Sale Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.sale_date}
                      onChange={(e) =>
                        setForm({ ...form, sale_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    <select
                      className="form-select"
                      value={form.payment_method}
                      onChange={(e) =>
                        setForm({ ...form, payment_method: e.target.value })
                      }
                      required
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  {/* Total Amount */}
                  <div className="form-group full">
                    <label className="form-label">Total Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={form.total_amount}
                      onChange={(e) =>
                        setForm({ ...form, total_amount: e.target.value })
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
                    ? 'Update Sale'
                    : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Sale Details Modal */}
      {detailsModalOpen && selectedSale && (
        <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Sale Receipt Items — #{selectedSale.sale_id}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Customer: {customerMap.get(selectedSale.customer_id)} • Payment: {selectedSale.payment_method}
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
                <p className="text-xs text-muted text-center py-8">Loading sold items...</p>
              ) : saleDetails.length > 0 ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ITEM ID</th>
                        <th>PRODUCT NAME</th>
                        <th>QUANTITY</th>
                        <th>UNIT PRICE</th>
                        <th className="text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleDetails.map((item) => {
                        const name =
                          item.product_name ||
                          productMap.get(item.product_id) ||
                          `Product #${item.product_id}`
                        const lineTotal = item.quantity * item.unit_price

                        return (
                          <tr key={item.sale_detail_id}>
                            <td className="font-mono text-muted text-xs">
                              #{item.sale_detail_id}
                            </td>
                            <td className="font-bold text-white text-xs">{name}</td>
                            <td className="text-muted text-xs">{item.quantity} units</td>
                            <td className="text-muted text-xs">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="font-bold text-emerald-400 text-xs text-right">
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
                  No individual line item details recorded for this sale.
                </p>
              )}

              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center text-xs">
                <span className="text-muted">Total Paid:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {formatCurrency(selectedSale.total_amount)}
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
        title="Delete Sale Receipt"
        message={`Are you sure you want to delete Sale Receipt #${deleteTarget?.sale_id}? Database integrity will prevent deletion if related details are stored.`}
        confirmText="Delete Sale"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

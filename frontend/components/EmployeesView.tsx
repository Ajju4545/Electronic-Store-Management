'use client'

import React, { useState, useMemo } from 'react'
import { BriefcaseBusiness, Plus, Pencil, Trash2, X, Phone, IndianRupee, ShieldCheck } from 'lucide-react'
import { Employee, api } from '../lib/api'
import ConfirmModal from './ConfirmModal'

interface EmployeesViewProps {
  employees: Employee[]
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

const emptyEmployee = {
  employee_name: '',
  phone: '',
  role: '',
  salary: '',
}

export default function EmployeesView({
  employees,
  query,
  onRefresh,
  showToast,
}: EmployeesViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyEmployee)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    return employees.filter((e) =>
      `${e.employee_name} ${e.phone || ''} ${e.role || ''} ${e.salary || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [employees, query])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm(emptyEmployee)
    setModalOpen(true)
  }

  const handleOpenEdit = (e: Employee) => {
    setEditingId(e.employee_id)
    setForm({
      employee_name: e.employee_name,
      phone: e.phone || '',
      role: e.role || '',
      salary: e.salary ? String(e.salary) : '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_name.trim()) {
      showToast('Employee name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        employee_name: form.employee_name.trim(),
        phone: form.phone.trim() || null,
        role: form.role.trim() || null,
        salary: form.salary ? Number(form.salary) : null,
      }

      if (editingId !== null) {
        await api.put(`/employees/${editingId}`, payload)
        showToast('Employee updated successfully!', 'success')
      } else {
        await api.post('/employees', payload)
        showToast('Employee added successfully!', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to save employee', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del(`/employees/${deleteTarget.employee_id}`)
      showToast(`Employee "${deleteTarget.employee_name}" deleted`, 'success')
      setDeleteTarget(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete employee (has recorded sales/purchases)', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> HUMAN RESOURCES & STAFF
          </div>
          <h1>
            Store <em>Employees</em>
          </h1>
          <p>Manage staff team members, store roles, and employee compensation.</p>
        </div>
        <div className="heading-actions">
          <button onClick={handleOpenCreate} className="gradient-button pulse-button">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-heading flex justify-between items-center">
          <div>
            <h2>
              Employees <span>{filtered.length} of {employees.length}</span>
            </h2>
            <p>Active store personnel records from MySQL</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>EMPLOYEE NAME</th>
                <th>PHONE NUMBER</th>
                <th>ROLE / POSITION</th>
                <th>MONTHLY SALARY</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.employee_id} className="product-row">
                  <td className="font-mono text-muted text-xs">#{e.employee_id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                        {e.employee_name.slice(0, 2).toUpperCase()}
                      </div>
                      <b className="text-white text-sm">{e.employee_name}</b>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>{e.phone || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-emerald">
                      <ShieldCheck className="w-3 h-3" /> {e.role || 'Staff'}
                    </span>
                  </td>
                  <td>
                    <strong className="text-white text-xs">
                      {e.salary ? formatCurrency(e.salary) : '—'}
                    </strong>
                  </td>
                  <td>
                    <div className="row-actions-wrap">
                      <button
                        className="action-btn edit"
                        onClick={() => handleOpenEdit(e)}
                        title="Edit Employee"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteTarget(e)}
                        title="Delete Employee"
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
                    No employees found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer">
          <span>
            Total Employees: <b>{employees.length}</b>
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Employee' : 'Add New Employee'}</h3>
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
                  <label className="form-label">Employee Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Priya Nair"
                    value={form.employee_name}
                    onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. +91 91234 56789"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Role / Position</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Store Manager, Sales Executive, Inventory Clerk"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salary (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="e.g. 45000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
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
                    ? 'Update Employee'
                    : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to delete employee "${deleteTarget?.employee_name}"? If this employee has authorized sales or purchases, the database will preserve records.`}
        confirmText="Delete Employee"
        danger={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

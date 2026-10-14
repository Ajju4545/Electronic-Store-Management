'use client'

import React from 'react'
import {
  X,
  ShieldCheck,
  Database,
  Server,
  UserCheck,
  Package,
  Users,
  Briefcase,
  CheckCircle,
} from 'lucide-react'
import { DashboardData } from '../lib/api'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  stats: DashboardData | null
  dbStatus: 'connected' | 'disconnected' | 'checking'
}

export default function ProfileModal({
  open,
  onClose,
  stats,
  dbStatus,
}: ProfileModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3>Administrator Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-muted transition"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Identity Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-violet-500/20">
              AK
            </div>
            <div>
              <h4 className="text-base font-bold text-white">System Administrator</h4>
              <span className="text-xs text-muted">Role: Full Store & Database Superuser</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-emerald">
                  <CheckCircle className="w-3 h-3" /> Active Session
                </span>
                <span className="badge badge-violet">Local Master</span>
              </div>
            </div>
          </div>

          {/* Real System Context */}
          <div className="space-y-2">
            <span className="form-label">System Environment & Infrastructure</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-1.5 text-muted mb-1">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Database Engine</span>
                </div>
                <strong className="text-white text-xs block">MySQL (electronic_store)</strong>
                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 inline-block">
                  Status: {dbStatus === 'connected' ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-1.5 text-muted mb-1">
                  <Server className="w-3.5 h-3.5 text-violet-400" />
                  <span>API Backend</span>
                </div>
                <strong className="text-white text-xs block">FastAPI Python 3.12</strong>
                <span className="text-[10px] text-muted mt-0.5 inline-block">
                  Host: 127.0.0.1:8000
                </span>
              </div>
            </div>
          </div>

          {/* Managed Entities */}
          <div className="space-y-2">
            <span className="form-label">Managed Database Records</span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Package className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <strong className="text-sm font-bold text-white block">
                  {stats?.total_products ?? 0}
                </strong>
                <span className="text-[10px] text-muted">Products</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <strong className="text-sm font-bold text-white block">
                  {stats?.total_customers ?? 0}
                </strong>
                <span className="text-[10px] text-muted">Customers</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <Briefcase className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <strong className="text-sm font-bold text-white block">
                  {stats?.total_employees ?? 0}
                </strong>
                <span className="text-[10px] text-muted">Staff</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="outline-button">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}

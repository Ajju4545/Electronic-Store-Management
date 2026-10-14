'use client'

import React from 'react'
import { X, LogOut } from 'lucide-react'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
  onConfirmLogout: () => void
}

export default function LogoutModal({
  open,
  onClose,
  onConfirmLogout,
}: LogoutModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-xs">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Session</h3>
              <p className="text-[11px] text-muted">Refresh store workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-muted transition"
            aria-label="Close logout modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            Are you sure you want to reset your local workspace session? This will refresh your client cache, reset temporary alert filters, and return you to the main store dashboard.
          </p>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-muted">
            All database records and store data will remain safely preserved in MySQL.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="outline-button">
            Cancel
          </button>
          <button
            onClick={onConfirmLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Reset Session
          </button>
        </div>
      </div>
    </div>
  )
}

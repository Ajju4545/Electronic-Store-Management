'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-box max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            {danger && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <h3>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/10 text-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="outline-button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              danger
                ? 'px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50'
                : 'gradient-button'
            }
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { X, Settings, Sliders, Bell, Globe, Clock, Check } from 'lucide-react'

export interface AppSettings {
  lowStockThreshold: number
  currency: string
  refreshInterval: number // in seconds, 0 = manual
  tablePageSize: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  lowStockThreshold: 5,
  currency: 'INR',
  refreshInterval: 0,
  tablePageSize: 25,
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  settings: AppSettings
  onSaveSettings: (newSettings: AppSettings) => void
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [current, setCurrent] = useState<AppSettings>(settings)

  useEffect(() => {
    setCurrent(settings)
  }, [settings, open])

  if (!open) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveSettings(current)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-xs">
              <Settings className="w-4 h-4" />
            </div>
            <h3>Account & System Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-muted transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body space-y-4">
            {/* Low stock threshold */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                <span>Low Stock Alert Threshold (Units)</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="form-input"
                value={current.lowStockThreshold}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    lowStockThreshold: Math.max(1, Number(e.target.value)),
                  })
                }
              />
              <span className="text-[11px] text-muted">
                Products with inventory equal to or less than this quantity trigger warnings.
              </span>
            </div>

            {/* Currency Format */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Currency Display</span>
              </label>
              <select
                className="form-select"
                value={current.currency}
                onChange={(e) =>
                  setCurrent({ ...current, currency: e.target.value })
                }
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
              </select>
            </div>

            {/* Auto-refresh interval */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Refresh Interval</span>
              </label>
              <select
                className="form-select"
                value={current.refreshInterval}
                onChange={(e) =>
                  setCurrent({ ...current, refreshInterval: Number(e.target.value) })
                }
              >
                <option value={0}>Manual (Use Refresh button)</option>
                <option value={30}>Every 30 Seconds</option>
                <option value={60}>Every 1 Minute</option>
                <option value={120}>Every 2 Minutes</option>
              </select>
            </div>

            {/* Table page size */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Table Rows Per Page</span>
              </label>
              <select
                className="form-select"
                value={current.tablePageSize}
                onChange={(e) =>
                  setCurrent({ ...current, tablePageSize: Number(e.target.value) })
                }
              >
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="outline-button"
            >
              Cancel
            </button>
            <button type="submit" className="gradient-button">
              <Check className="w-4 h-4 mr-1" /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

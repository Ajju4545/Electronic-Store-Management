'use client'

import React, { useRef, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  CheckCircle2,
  CheckCheck,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { NavItemKey } from './Sidebar'

export interface AppNotification {
  id: string
  type: 'low_stock' | 'sale' | 'purchase' | 'system'
  title: string
  description: string
  time?: string
  read: boolean
  targetModule: NavItemKey
}

interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
  notifications: AppNotification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNavigate: (module: NavItemKey) => void
  loading?: boolean
}

export default function NotificationDropdown({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
  loading = false,
}: NotificationDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle outside click & escape
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-96 rounded-2xl bg-[#14152f] border border-violet-500/30 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      role="region"
      aria-label="Notifications Panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-sm font-bold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <span className="badge badge-rose text-[10px] px-1.5 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold px-2 py-1 rounded hover:bg-white/5 transition flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5 p-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted space-y-2">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Scanning database for live alerts...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => {
            const isUnread = !item.read

            let Icon = AlertTriangle
            let iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'

            if (item.type === 'low_stock') {
              Icon = AlertTriangle
              iconColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            } else if (item.type === 'sale') {
              Icon = Receipt
              iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            } else if (item.type === 'purchase') {
              Icon = ShoppingCart
              iconColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            }

            return (
              <div
                key={item.id}
                onClick={() => {
                  onMarkAsRead(item.id)
                  onNavigate(item.targetModule)
                  onClose()
                }}
                className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 hover:bg-white/[0.04] ${
                  isUnread ? 'bg-violet-500/[0.07]' : 'opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-white truncate">
                      {item.title}
                    </h5>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted">
                    <span>{item.time || 'Recent activity'}</span>
                    <span className="text-violet-400 flex items-center gap-0.5">
                      View {item.targetModule} <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-xs text-muted space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto" />
            <p className="font-semibold text-white">All caught up!</p>
            <p className="text-[11px]">No pending stock alerts or issues detected.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-black/30 border-t border-white/5 text-center">
        <span className="text-[10px] text-muted">
          Alerts synthesized from live MySQL inventory & transactions
        </span>
      </div>
    </div>
  )
}

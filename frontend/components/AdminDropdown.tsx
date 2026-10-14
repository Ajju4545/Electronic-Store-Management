'use client'

import React, { useRef, useEffect } from 'react'
import {
  Settings,
  KeyRound,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react'
import { AdminUser } from '../lib/api'

interface AdminDropdownProps {
  open: boolean
  onClose: () => void
  user: AdminUser | null
  onOpenSettings: () => void
  onOpenPassword: () => void
  onOpenLogout: () => void
}

export default function AdminDropdown({
  open,
  onClose,
  user,
  onOpenSettings,
  onOpenPassword,
  onOpenLogout,
}: AdminDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Store Administrator')
  const email = user?.email || 'admin@electrostore.com'

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 z-50 w-72 rounded-2xl bg-[#14152f] border border-violet-500/30 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      role="menu"
      aria-label="Admin User Menu"
    >
      {/* Header Profile preview with authenticated user details */}
      <div className="p-3.5 border-b border-white/10 bg-black/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="text-xs font-bold text-white block truncate">
            {displayName}
          </strong>
          <span className="text-[11px] text-muted block truncate">
            {email}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Store Administrator</span>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="p-1.5 space-y-0.5">
        <button
          onClick={() => {
            onOpenSettings()
            onClose()
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-white hover:bg-white/[0.06] transition text-left group"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <b className="block text-xs">Account Settings</b>
              <span className="text-[10px] text-muted">System & alert preferences</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-white transition" />
        </button>

        <button
          onClick={() => {
            onOpenPassword()
            onClose()
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-white hover:bg-white/[0.06] transition text-left group"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <div>
              <b className="block text-xs">Change Password</b>
              <span className="text-[10px] text-muted">Update account password</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-white transition" />
        </button>

        <div className="my-1 border-t border-white/5" />

        <button
          onClick={() => {
            onOpenLogout()
            onClose()
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 transition text-left group"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <div>
              <b className="block text-xs">Logout</b>
              <span className="text-[10px] text-rose-400/70">Sign out of session</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-rose-400/70 group-hover:text-rose-300 transition" />
        </button>
      </div>
    </div>
  )
}

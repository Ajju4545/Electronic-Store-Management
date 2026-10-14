'use client'

import React, { useState } from 'react'
import {
  Menu,
  Search,
  Bell,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import AdminDropdown from './AdminDropdown'
import NotificationDropdown, { AppNotification } from './NotificationDropdown'
import { NavItemKey } from './Sidebar'
import { AdminUser } from '../lib/api'

interface NavbarProps {
  query: string
  setQuery: (q: string) => void
  onToggleMobileMenu: () => void
  onRefresh: () => void
  refreshing: boolean
  dbStatus: 'connected' | 'disconnected' | 'checking'
  onCheckDbStatus: () => void
  activeModule: string
  notifications: AppNotification[]
  onMarkNotificationAsRead: (id: string) => void
  onMarkAllNotificationsAsRead: () => void
  onNavigate: (module: NavItemKey) => void
  user: AdminUser | null
  onOpenSettings: () => void
  onOpenPassword: () => void
  onOpenLogout: () => void
}

export default function Navbar({
  query,
  setQuery,
  onToggleMobileMenu,
  onRefresh,
  refreshing,
  dbStatus,
  onCheckDbStatus,
  activeModule,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onNavigate,
  user,
  onOpenSettings,
  onOpenPassword,
  onOpenLogout,
}: NavbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

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

  const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Admin')
  const userRole = user?.email || 'Superuser'

  return (
    <header className="topbar relative">
      {/* Mobile Menu Hamburger */}
      <button
        className="mobile-menu"
        onClick={onToggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <Menu />
      </button>

      {/* Task 2: Functional Search Input (without keyboard shortcut badge) */}
      <div className="search-wrap">
        <Search className="w-4 h-4 text-muted shrink-0" />
        <input
          aria-label={`Search in ${activeModule}`}
          placeholder={`Search ${activeModule.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border-0 outline-none text-white text-xs placeholder:text-muted"
        />
      </div>

      {/* Top Right Actions */}
      <div className="top-actions relative">
        {/* Task 5: Dynamic MySQL Health Status indicator */}
        <button
          onClick={onCheckDbStatus}
          disabled={dbStatus === 'checking'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer hover:opacity-90 ${
            dbStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : dbStatus === 'checking'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
          title="Click to verify MySQL database connectivity"
        >
          {dbStatus === 'connected' ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">MySQL Online</span>
            </>
          ) : dbStatus === 'checking' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              <span className="hidden sm:inline">Checking DB...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Database Offline</span>
            </>
          )}
        </button>

        {/* Task 5: Single-click Protected Refresh button with loading feedback */}
        <button
          className="icon-button"
          onClick={onRefresh}
          disabled={refreshing}
          title={refreshing ? 'Refreshing data...' : 'Refresh data from MySQL'}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw
            className={`w-4 h-4 transition-transform ${
              refreshing ? 'spin text-violet-400' : ''
            }`}
          />
        </button>

        {/* Task 4: Functional Notification Bell with Badge & Dropdown */}
        <div className="relative">
          <button
            className={`icon-button notification ${
              notificationsOpen ? '!border-violet-500 text-white' : ''
            }`}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              setProfileDropdownOpen(false)
            }}
            title="Notifications"
            aria-label="View notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <i />}
          </button>

          {/* Notifications Dropdown Panel */}
          <NotificationDropdown
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onNavigate={onNavigate}
            loading={refreshing}
          />
        </div>

        {/* Task 3: Interactive Admin Profile button & dropdown menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-violet-500/40 transition cursor-pointer text-left"
            aria-label="Admin User Profile Menu"
            aria-expanded={profileDropdownOpen}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-extrabold text-white text-xs shadow-sm shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col max-w-[130px]">
              <span className="text-xs font-bold text-white leading-tight truncate">{displayName}</span>
              <span className="text-[10px] text-muted leading-tight truncate">{userRole}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted transition-transform shrink-0 ${
                profileDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Admin Dropdown Menu */}
          <AdminDropdown
            open={profileDropdownOpen}
            onClose={() => setProfileDropdownOpen(false)}
            user={user}
            onOpenSettings={onOpenSettings}
            onOpenPassword={onOpenPassword}
            onOpenLogout={onOpenLogout}
          />
        </div>
      </div>
    </header>
  )
}

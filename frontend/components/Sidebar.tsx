'use client'

import React from 'react'
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Truck,
  BriefcaseBusiness,
  ShoppingBag,
  CircleDollarSign,
  FileBarChart,
  Zap,
  ChevronDown,
  Sparkles,
  Settings,
  MoreHorizontal,
  Circle,
} from 'lucide-react'

export type NavItemKey =
  | 'Dashboard'
  | 'Products'
  | 'Categories'
  | 'Customers'
  | 'Suppliers'
  | 'Employees'
  | 'Purchases'
  | 'Sales'
  | 'Reports'

interface SidebarProps {
  active: NavItemKey
  setActive: (item: NavItemKey) => void
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  user?: { email: string; full_name?: string | null } | null
  dbStatus?: 'connected' | 'disconnected' | 'checking'
}

const navItems: { label: NavItemKey; icon: any; color: string }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, color: 'violet' },
  { label: 'Products', icon: Package, color: 'blue' },
  { label: 'Categories', icon: Tags, color: 'pink' },
  { label: 'Customers', icon: Users, color: 'cyan' },
  { label: 'Suppliers', icon: Truck, color: 'orange' },
  { label: 'Employees', icon: BriefcaseBusiness, color: 'green' },
  { label: 'Purchases', icon: ShoppingBag, color: 'amber' },
  { label: 'Sales', icon: CircleDollarSign, color: 'emerald' },
  { label: 'Reports', icon: FileBarChart, color: 'indigo' },
]

export default function Sidebar({
  active,
  setActive,
  isOpenMobile = false,
  onCloseMobile,
  user = null,
  dbStatus = 'connected',
}: SidebarProps) {
  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  const userDisplayName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Admin Portal')
  const userSubText = user?.email || 'Administrator'

  return (
    <aside
      className={`sidebar glass-panel ${isOpenMobile ? '!flex fixed inset-y-0 left-0 z-50 bg-[#0d0d24]' : ''}`}
    >
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <Zap />
        </div>
        <div>
          <strong>
            Electro<span>Store</span>
          </strong>
          <small>MANAGEMENT SYSTEM</small>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.label

          return (
            <button
              key={item.label}
              className={`nav-item nav-${item.color} ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActive(item.label)
                if (onCloseMobile) onCloseMobile()
              }}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Bar */}
      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <Sparkles />
          <b>Database Status</b>
          <span>
            {dbStatus === 'connected'
              ? 'Connected to MySQL'
              : dbStatus === 'checking'
              ? 'Checking connection...'
              : 'Disconnected from MySQL'}
          </span>
        </div>

        <div className="profile">
          <div className="profile-avatar">{userInitials}</div>
          <div className="min-w-0">
            <b className="truncate block">{userDisplayName}</b>
            <small className="truncate block">{userSubText}</small>
          </div>
        </div>
      </div>
    </aside>
  )
}

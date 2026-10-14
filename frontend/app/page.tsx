'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Sidebar, { NavItemKey } from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast, { ToastMessage } from '../components/Toast'

import SettingsModal, { AppSettings, DEFAULT_SETTINGS } from '../components/SettingsModal'
import ChangePasswordModal from '../components/ChangePasswordModal'
import LogoutModal from '../components/LogoutModal'

import DashboardView from '../components/DashboardView'
import ProductsView from '../components/ProductsView'
import CategoriesView from '../components/CategoriesView'
import CustomersView from '../components/CustomersView'
import SuppliersView from '../components/SuppliersView'
import EmployeesView from '../components/EmployeesView'
import PurchasesView from '../components/PurchasesView'
import SalesView from '../components/SalesView'
import ReportsView from '../components/ReportsView'

import {
  api,
  Category,
  Customer,
  Employee,
  Supplier,
  Product,
  Purchase,
  Sale,
  DashboardData,
  SalesReport,
  PurchasesReport,
  InventoryReport,
  TopProductReport,
  PaymentMethodReport,
  AdminUser,
} from '../lib/api'
import { AppNotification } from '../components/NotificationDropdown'

const SETTINGS_KEY = 'electrostore_app_settings'
const READ_NOTIFICATIONS_KEY = 'electrostore_read_notifications'

const DEFAULT_ADMIN: AdminUser = {
  id: 1,
  email: 'admin@electrostore.local',
  full_name: 'Store Administrator',
}

export default function Page() {
  const [currentUser] = useState<AdminUser>(DEFAULT_ADMIN)

  const [active, setActive] = useState<NavItemKey>('Dashboard')
  const [query, setQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [apiError, setApiError] = useState('')

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  // Read Notifications State
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set())

  // Admin Modal States
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Load Settings & Read Notifs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) setSettings(JSON.parse(saved))
    } catch {}

    try {
      const readSaved = localStorage.getItem(READ_NOTIFICATIONS_KEY)
      if (readSaved) setReadNotifIds(new Set(JSON.parse(readSaved)))
    } catch {}
  }, [])

  // Save Settings handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    } catch {}
    showToast('System settings saved successfully!', 'success')
  }

  // App Data States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [sales, setSales] = useState<Sale[]>([])

  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(null)
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [purchasesReport, setPurchasesReport] = useState<PurchasesReport | null>(null)
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodReport[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])

  // Concurrency locks
  const isRefreshingRef = useRef(false)
  const isCheckingDbRef = useRef(false)

  // Live Database Health Check
  const checkDbStatus = useCallback(async (): Promise<boolean> => {
    if (isCheckingDbRef.current) return false
    isCheckingDbRef.current = true
    setDbStatus('checking')

    try {
      const res = await api.checkHealth()
      if (res && (res.status === 'success' || res.database === 'connected')) {
        setDbStatus('connected')
        setApiError('')
        return true
      } else {
        setDbStatus('disconnected')
        setApiError(res?.message || 'Database disconnected')
        return false
      }
    } catch (err: any) {
      setDbStatus('disconnected')
      setApiError(err.message || 'Cannot communicate with backend on port 8000')
      return false
    } finally {
      isCheckingDbRef.current = false
    }
  }, [])

  // Load all data
  const loadAllData = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setRefreshing(true)
    setApiError('')

    try {
      // First verify database connection
      const isConnected = await checkDbStatus()
      if (!isConnected) {
        return
      }

      const [
        prods,
        cats,
        custs,
        supps,
        emps,
        purs,
        sls,
        dash,
        sRep,
        pRep,
        iRep,
        tProds,
        pMethods,
        lStock,
      ] = await Promise.all([
        api.get<Product[]>('/products').catch(() => []),
        api.get<Category[]>('/categories').catch(() => []),
        api.get<Customer[]>('/customers').catch(() => []),
        api.get<Supplier[]>('/suppliers').catch(() => []),
        api.get<Employee[]>('/employees').catch(() => []),
        api.get<Purchase[]>('/purchases').catch(() => []),
        api.get<Sale[]>('/sales').catch(() => []),
        api.get<DashboardData>('/dashboard').catch(() => null),
        api.get<SalesReport>('/reports/sales').catch(() => null),
        api.get<PurchasesReport>('/reports/purchases').catch(() => null),
        api.get<InventoryReport>('/reports/inventory').catch(() => null),
        api.get<TopProductReport[]>('/reports/top-products').catch(() => []),
        api.get<PaymentMethodReport[]>('/reports/payment-methods').catch(() => []),
        api.get<Product[]>('/reports/low-stock').catch(() => []),
      ])

      setProducts(prods || [])
      setCategories(cats || [])
      setCustomers(custs || [])
      setSuppliers(supps || [])
      setEmployees(emps || [])
      setPurchases(purs || [])
      setSales(sls || [])
      setDashboardStats(dash)
      setSalesReport(sRep)
      setPurchasesReport(pRep)
      setInventoryReport(iRep)
      setTopProducts(tProds || [])
      setPaymentMethods(pMethods || [])
      setLowStockProducts(lStock || [])
      setDbStatus('connected')
    } catch (err: any) {
      setDbStatus('disconnected')
      setApiError(err.message || 'Cannot communicate with FastAPI backend')
      showToast(err.message || 'Backend connection failed', 'error')
    } finally {
      isRefreshingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [checkDbStatus, showToast])

  // Initial load once on mount
  useEffect(() => {
    loadAllData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh interval if configured in Settings
  useEffect(() => {
    if (settings.refreshInterval <= 0) return
    const timer = setInterval(() => {
      loadAllData()
    }, settings.refreshInterval * 1000)
    return () => clearInterval(timer)
  }, [settings.refreshInterval, loadAllData])

  // Derive Real Dynamic Notifications from MySQL data
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = []

    // 1. Connection warning if database is disconnected
    if (dbStatus === 'disconnected') {
      list.push({
        id: 'sys-db-offline',
        type: 'system',
        title: 'MySQL Disconnected',
        description: 'FastAPI backend cannot reach MySQL database on port 3306.',
        time: 'Just now',
        read: false,
        targetModule: 'Dashboard',
      })
    }

    // 2. Low stock alert items (based on configured threshold)
    const threshold = settings.lowStockThreshold || 5
    const alertProducts = products.filter(
      (p) => p.stock_quantity > 0 && p.stock_quantity <= threshold
    )
    alertProducts.slice(0, 5).forEach((p) => {
      const notifId = `low-stock-${p.product_id}`
      list.push({
        id: notifId,
        type: 'low_stock',
        title: `Low Stock: ${p.product_name}`,
        description: `Only ${p.stock_quantity} units remaining in inventory. Reorder recommended.`,
        time: `${p.stock_quantity} units left`,
        read: readNotifIds.has(notifId),
        targetModule: 'Products',
      })
    })

    // 3. Out of stock products
    const outProducts = products.filter((p) => p.stock_quantity === 0)
    outProducts.slice(0, 3).forEach((p) => {
      const notifId = `out-stock-${p.product_id}`
      list.push({
        id: notifId,
        type: 'low_stock',
        title: `Out of Stock: ${p.product_name}`,
        description: 'Product inventory depleted (0 units).',
        time: '0 units',
        read: readNotifIds.has(notifId),
        targetModule: 'Products',
      })
    })

    // 4. Recent sales
    const recSales = dashboardStats?.recent_sales || []
    recSales.slice(0, 3).forEach((s) => {
      const notifId = `sale-${s.sale_id}`
      list.push({
        id: notifId,
        type: 'sale',
        title: `Sale Receipt #${s.sale_id}`,
        description: `Completed sale of ₹${Number(s.total_amount || 0).toLocaleString('en-IN')} (${s.payment_method || 'Cash'}).`,
        time: s.sale_date,
        read: readNotifIds.has(notifId),
        targetModule: 'Sales',
      })
    })

    // 5. Recent purchases
    const recPurchases = dashboardStats?.recent_purchases || []
    recPurchases.slice(0, 3).forEach((p) => {
      const notifId = `purchase-${p.purchase_id}`
      list.push({
        id: notifId,
        type: 'purchase',
        title: `Purchase Order #${p.purchase_id}`,
        description: `Procured stock for ₹${Number(p.total_cost || 0).toLocaleString('en-IN')}.`,
        time: p.purchase_date,
        read: readNotifIds.has(notifId),
        targetModule: 'Purchases',
      })
    })

    return list
  }, [dbStatus, products, settings.lowStockThreshold, dashboardStats, readNotifIds])

  // Notification read actions
  const markNotificationAsRead = (id: string) => {
    setReadNotifIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const markAllNotificationsAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadNotifIds(allIds)
    try {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...allIds]))
    } catch {}
    showToast('All notifications marked as read', 'success')
  }

  // Session reset / logout handler
  const handleConfirmLogout = () => {
    setLogoutModalOpen(false)
    setReadNotifIds(new Set())
    try {
      localStorage.removeItem(READ_NOTIFICATIONS_KEY)
    } catch {}
    setActive('Dashboard')
    showToast('Session refreshed. Returned to store dashboard.', 'success')
  }

  return (
    <main className="app-shell">
      {/* Ambient background glow */}
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />
      <div className="grid-overlay" />

      {/* Floating System Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Task 1: Clean Left Sidebar Navigation (Store Branch card & numeric badges removed) */}
      <Sidebar
        active={active}
        setActive={(m) => {
          setActive(m)
          setQuery('')
        }}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        user={currentUser}
        dbStatus={dbStatus}
      />

      {/* Main App Content Area */}
      <section className="main-content">
        {/* Top Navbar */}
        <Navbar
          query={query}
          setQuery={setQuery}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onRefresh={loadAllData}
          refreshing={refreshing}
          dbStatus={dbStatus}
          onCheckDbStatus={checkDbStatus}
          activeModule={active}
          notifications={notifications}
          onMarkNotificationAsRead={markNotificationAsRead}
          onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
          onNavigate={(m) => {
            setActive(m)
            setQuery('')
          }}
          user={currentUser}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenPassword={() => setPasswordModalOpen(true)}
          onOpenLogout={() => setLogoutModalOpen(true)}
        />

        {/* Page Inner Content */}
        <div className="page-inner">
          {/* Breadcrumb Path */}
          <div className="breadcrumb">
            <span>ElectroStore OS</span>
            <span>/</span>
            <b>{active}</b>
          </div>

          {/* Database / Backend Connection Error Alert */}
          {apiError && (
            <div className="api-error mb-6 flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <div>
                <strong className="font-bold text-white">Database Status Alert: </strong>
                <span>{apiError}</span>
              </div>
              <button
                onClick={loadAllData}
                className="ml-4 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold transition"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Module Router based on active sidebar selection */}
          {active === 'Dashboard' && (
            <DashboardView
              stats={dashboardStats}
              salesReport={salesReport}
              purchasesReport={purchasesReport}
              inventoryReport={inventoryReport}
              lowStockProducts={lowStockProducts}
              topProducts={topProducts}
              onNavigate={(m) => {
                setActive(m)
                setQuery('')
              }}
              loading={loading}
            />
          )}

          {active === 'Products' && (
            <ProductsView
              products={products}
              categories={categories}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Categories' && (
            <CategoriesView
              categories={categories}
              products={products}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Customers' && (
            <CustomersView
              customers={customers}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Employees' && (
            <EmployeesView
              employees={employees}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Purchases' && (
            <PurchasesView
              purchases={purchases}
              suppliers={suppliers}
              employees={employees}
              products={products}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Sales' && (
            <SalesView
              sales={sales}
              customers={customers}
              employees={employees}
              products={products}
              query={query}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {active === 'Reports' && (
            <ReportsView
              salesReport={salesReport}
              purchasesReport={purchasesReport}
              inventoryReport={inventoryReport}
              topProducts={topProducts}
              paymentMethods={paymentMethods}
              lowStockProducts={lowStockProducts}
              onRefresh={loadAllData}
            />
          )}
        </div>
      </section>

      {/* System Modals */}
      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        showToast={showToast}
      />

      <LogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </main>
  )
}

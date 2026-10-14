'use client'

import React from 'react'
import {
  Package,
  Tags,
  Users,
  Truck,
  BriefcaseBusiness,
  ShoppingBag,
  CircleDollarSign,
  AlertTriangle,
  TrendingUp,
  Boxes,
  ArrowUpRight,
  Receipt,
  IndianRupee,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  DashboardData,
  SalesReport,
  PurchasesReport,
  InventoryReport,
  Product,
  TopProductReport,
} from '../lib/api'

interface DashboardViewProps {
  stats: DashboardData | null
  salesReport: SalesReport | null
  purchasesReport: PurchasesReport | null
  inventoryReport: InventoryReport | null
  lowStockProducts: Product[]
  topProducts: TopProductReport[]
  onNavigate: (module: any) => void
  loading: boolean
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)

export default function DashboardView({
  stats,
  salesReport,
  purchasesReport,
  inventoryReport,
  lowStockProducts,
  topProducts,
  onNavigate,
  loading,
}: DashboardViewProps) {
  const chartData = [
    {
      name: 'Purchases',
      amount: purchasesReport?.total_purchase_cost || 0,
      count: purchasesReport?.total_purchases || stats?.total_purchases || 0,
    },
    {
      name: 'Sales',
      amount: salesReport?.total_sales_amount || 0,
      count: salesReport?.total_sales || stats?.total_sales || 0,
    },
  ]

  const totalProducts = stats?.total_products ?? 0
  const totalCategories = stats?.total_categories ?? 0
  const totalCustomers = stats?.total_customers ?? 0
  const totalSuppliers = stats?.total_suppliers ?? 0
  const totalEmployees = stats?.total_employees ?? 0
  const totalPurchases = stats?.total_purchases ?? 0
  const totalSales = stats?.total_sales ?? 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> LIVE SYSTEM METRICS
          </div>
          <h1>
            Store <em>Dashboard</em>
          </h1>
          <p>Real-time analytics and inventory performance from your MySQL database.</p>
        </div>
        <div className="heading-actions">
          <button
            onClick={() => onNavigate('Reports')}
            className="outline-button"
          >
            Detailed Analytics <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* 7 Core System Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Products */}
        <button
          onClick={() => onNavigate('Products')}
          className="stat-card stat-blue text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <Package />
          </div>
          <div className="stat-copy">
            <span>Products</span>
            <strong>{totalProducts}</strong>
            <small>Total in Catalog</small>
          </div>
        </button>

        {/* Categories */}
        <button
          onClick={() => onNavigate('Categories')}
          className="stat-card stat-pink text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <Tags />
          </div>
          <div className="stat-copy">
            <span>Categories</span>
            <strong>{totalCategories}</strong>
            <small>Active Groups</small>
          </div>
        </button>

        {/* Customers */}
        <button
          onClick={() => onNavigate('Customers')}
          className="stat-card stat-cyan text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-copy">
            <span>Customers</span>
            <strong>{totalCustomers}</strong>
            <small>Registered</small>
          </div>
        </button>

        {/* Suppliers */}
        <button
          onClick={() => onNavigate('Suppliers')}
          className="stat-card stat-orange text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <Truck />
          </div>
          <div className="stat-copy">
            <span>Suppliers</span>
            <strong>{totalSuppliers}</strong>
            <small>Partner Vendors</small>
          </div>
        </button>

        {/* Employees */}
        <button
          onClick={() => onNavigate('Employees')}
          className="stat-card stat-green text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <BriefcaseBusiness />
          </div>
          <div className="stat-copy">
            <span>Employees</span>
            <strong>{totalEmployees}</strong>
            <small>Store Staff</small>
          </div>
        </button>

        {/* Purchases */}
        <button
          onClick={() => onNavigate('Purchases')}
          className="stat-card stat-amber text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <ShoppingBag />
          </div>
          <div className="stat-copy">
            <span>Purchases</span>
            <strong>{totalPurchases}</strong>
            <small>Transactions</small>
          </div>
        </button>

        {/* Sales */}
        <button
          onClick={() => onNavigate('Sales')}
          className="stat-card stat-green text-left hover:scale-[1.02] transition"
        >
          <div className="stat-icon">
            <CircleDollarSign />
          </div>
          <div className="stat-copy">
            <span>Sales</span>
            <strong>{totalSales}</strong>
            <small>Completed</small>
          </div>
        </button>
      </div>

      {/* Financial & Inventory Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Financial Comparison Chart */}
        <div className="content-card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Financial Comparison</h2>
              <p className="text-xs text-muted">Purchase Cost vs. Total Sales Revenue</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
                Purchases: {formatCurrency(purchasesReport?.total_purchase_cost || 0)}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 ml-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Sales: {formatCurrency(salesReport?.total_sales_amount || 0)}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#8d91ad" fontSize={12} />
                <YAxis
                  stroke="#8d91ad"
                  fontSize={11}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#151532',
                    borderColor: 'rgba(139,92,246,0.4)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  barSize={60}
                />
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Valuation Card */}
        <div className="content-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">INVENTORY VALUATION</span>
              <Boxes className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(inventoryReport?.inventory_value || 0)}
            </h3>
            <p className="text-xs text-muted mt-1">Total asset value of stock on hand</p>
          </div>

          <div className="my-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Total Stock Units:</span>
              <span className="font-bold text-white">
                {inventoryReport?.total_stock_items?.toLocaleString() || 0} items
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Low Stock Alerts:</span>
              <span className="font-bold text-rose-400">
                {lowStockProducts.length} items
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Average Unit Cost:</span>
              <span className="font-bold text-cyan-300">
                {inventoryReport && inventoryReport.total_stock_items > 0
                  ? formatCurrency(
                      inventoryReport.inventory_value / inventoryReport.total_stock_items
                    )
                  : '₹0'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('Products')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition flex items-center justify-center gap-2"
          >
            Manage Product Inventory <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Top Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products */}
        <div className="content-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Top Selling Products</h2>
              <p className="text-xs text-muted">Ranked by total quantity sold</p>
            </div>
            <button
              onClick={() => onNavigate('Reports')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              View Report →
            </button>
          </div>

          <div className="space-y-2.5">
            {topProducts.slice(0, 5).map((p, index) => (
              <div
                key={p.product_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.product_name}</h4>
                    <span className="text-[10px] text-muted">Product #{p.product_id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge-emerald">
                    {p.total_quantity_sold} units sold
                  </span>
                </div>
              </div>
            ))}
            {!topProducts.length && (
              <p className="text-xs text-muted text-center py-6">No sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="content-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div>
                <h2 className="text-base font-bold text-white">Low Stock Alerts</h2>
                <p className="text-xs text-muted">Products needing reorder (≤ 5 units)</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('Products')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Reorder Now →
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.slice(0, 5).map((p) => (
              <div
                key={p.product_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/15"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{p.product_name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                    <span>{p.brand || 'Unbranded'}</span>
                    <span>•</span>
                    <span>{formatCurrency(p.price)}</span>
                  </div>
                </div>
                <div>
                  <span
                    className={`badge ${
                      p.stock_quantity <= 2 ? 'badge-rose' : 'badge-amber'
                    }`}
                  >
                    Only {p.stock_quantity} left
                  </span>
                </div>
              </div>
            ))}
            {!lowStockProducts.length && (
              <div className="text-center py-6 text-emerald-400 text-xs">
                ✓ All products are adequately stocked!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Purchases & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Purchases */}
        <div className="content-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Recent Purchases</h2>
            </div>
            <button
              onClick={() => onNavigate('Purchases')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              All Purchases ({stats?.total_purchases || 0}) →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th className="py-2">ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Supplier ID</th>
                  <th className="py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.recent_purchases || []).map((pur) => (
                  <tr key={pur.purchase_id} className="hover:bg-white/[0.02]">
                    <td className="py-2 font-mono text-muted">#{pur.purchase_id}</td>
                    <td className="py-2 text-white">{pur.purchase_date}</td>
                    <td className="py-2 text-muted">Vendor #{pur.supplier_id}</td>
                    <td className="py-2 font-semibold text-amber-400 text-right">
                      {formatCurrency(pur.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="content-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Recent Sales</h2>
            </div>
            <button
              onClick={() => onNavigate('Sales')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              All Sales ({stats?.total_sales || 0}) →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th className="py-2">ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.recent_sales || []).map((s) => (
                  <tr key={s.sale_id} className="hover:bg-white/[0.02]">
                    <td className="py-2 font-mono text-muted">#{s.sale_id}</td>
                    <td className="py-2 text-white">{s.sale_date}</td>
                    <td className="py-2">
                      <span className="badge badge-emerald">
                        {s.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-2 font-semibold text-emerald-400 text-right">
                      {formatCurrency(s.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

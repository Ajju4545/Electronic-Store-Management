'use client'

import React, { useState } from 'react'
import {
  FileBarChart,
  BarChart3,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Package,
  ShoppingBag,
  IndianRupee,
  Layers,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import {
  SalesReport,
  PurchasesReport,
  InventoryReport,
  TopProductReport,
  PaymentMethodReport,
  Product,
} from '../lib/api'

interface ReportsViewProps {
  salesReport: SalesReport | null
  purchasesReport: PurchasesReport | null
  inventoryReport: InventoryReport | null
  topProducts: TopProductReport[]
  paymentMethods: PaymentMethodReport[]
  lowStockProducts: Product[]
  onRefresh: () => void
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0)

const PAYMENT_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b']

export default function ReportsView({
  salesReport,
  purchasesReport,
  inventoryReport,
  topProducts,
  paymentMethods,
  lowStockProducts,
  onRefresh,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'top_products' | 'low_stock'>('overview')

  const totalSales = salesReport?.total_sales_amount || 0
  const totalPurchases = purchasesReport?.total_purchase_cost || 0
  const grossDiff = totalSales - totalPurchases

  const paymentChartData = paymentMethods.map((p) => ({
    name: p.payment_method || 'Unknown',
    amount: Number(p.total_amount || 0),
    salesCount: p.total_sales || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> EXECUTIVE INTELLIGENCE
          </div>
          <h1>
            Business <em>Reports</em>
          </h1>
          <p>Comprehensive financial summaries, inventory metrics, and sales analytics.</p>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="stat-card stat-green">
          <div className="stat-icon">
            <IndianRupee />
          </div>
          <div className="stat-copy">
            <span>Total Sales Revenue</span>
            <strong>{formatCurrency(totalSales)}</strong>
            <small>
              <TrendingUp className="w-3 h-3" /> {salesReport?.total_sales || 0} customer orders
            </small>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="stat-card stat-amber">
          <div className="stat-icon">
            <ShoppingBag />
          </div>
          <div className="stat-copy">
            <span>Total Purchases Cost</span>
            <strong>{formatCurrency(totalPurchases)}</strong>
            <small>
              <ShoppingBag className="w-3 h-3" /> {purchasesReport?.total_purchases || 0} vendor orders
            </small>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="stat-card stat-cyan">
          <div className="stat-icon">
            <Package />
          </div>
          <div className="stat-copy">
            <span>Inventory Valuation</span>
            <strong>{formatCurrency(inventoryReport?.inventory_value || 0)}</strong>
            <small>
              <Layers className="w-3 h-3" /> {inventoryReport?.total_stock_items?.toLocaleString() || 0} units in stock
            </small>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="stat-card stat-pink">
          <div className="stat-icon">
            <AlertTriangle />
          </div>
          <div className="stat-copy">
            <span>Low Stock Items</span>
            <strong>{lowStockProducts.length}</strong>
            <small className="text-rose-400">
              Needs procurement restock
            </small>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="w-4 h-4" /> Financials & Payments
        </button>
        <button
          className={`tab-item ${activeTab === 'top_products' ? 'active' : ''}`}
          onClick={() => setActiveTab('top_products')}
        >
          <TrendingUp className="w-4 h-4" /> Top Selling Products
        </button>
        <button
          className={`tab-item ${activeTab === 'low_stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low_stock')}
        >
          <AlertTriangle className="w-4 h-4" /> Low Stock Analysis ({lowStockProducts.length})
        </button>
      </div>

      {/* Tab: Overview & Payments */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Payment Method Chart */}
          <div className="content-card p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Sales by Payment Method</h2>
                <p className="text-xs text-muted">Distribution of revenue across payment channels</p>
              </div>
              <CreditCard className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#8d91ad" fontSize={12} />
                  <YAxis
                    stroke="#8d91ad"
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#151532',
                      borderColor: 'rgba(139,92,246,0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={45}>
                    {paymentChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Breakdown Table */}
          <div className="content-card p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Payment Method Breakdown</h2>
                <p className="text-xs text-muted">Aggregated transactions by tender type</p>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>METHOD</th>
                    <th>TRANSACTIONS</th>
                    <th className="text-right">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((p, i) => (
                    <tr key={p.payment_method || i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                PAYMENT_COLORS[i % PAYMENT_COLORS.length],
                            }}
                          />
                          <b className="text-white text-xs">
                            {p.payment_method || 'Unknown'}
                          </b>
                        </div>
                      </td>
                      <td className="text-muted text-xs">
                        {p.total_sales} transactions
                      </td>
                      <td className="font-bold text-emerald-400 text-xs text-right">
                        {formatCurrency(p.total_amount)}
                      </td>
                    </tr>
                  ))}
                  {!paymentMethods.length && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-muted text-xs">
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex justify-between items-center text-xs">
              <span className="text-muted">Total Sales Captured:</span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(totalSales)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Top Selling Products */}
      {activeTab === 'top_products' && (
        <div className="content-card">
          <div className="card-heading flex justify-between items-center">
            <div>
              <h2>Top Products by Volume Sold</h2>
              <p>Performance based on completed sale receipts</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>PRODUCT ID</th>
                  <th>PRODUCT NAME</th>
                  <th className="text-right">TOTAL QUANTITY SOLD</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_id} className="product-row">
                    <td>
                      <span className="w-6 h-6 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs font-bold inline-flex items-center justify-center">
                        {i + 1}
                      </span>
                    </td>
                    <td className="font-mono text-muted text-xs">#{p.product_id}</td>
                    <td>
                      <b className="text-white text-xs">{p.product_name}</b>
                    </td>
                    <td className="text-right">
                      <span className="badge badge-emerald">
                        {p.total_quantity_sold} units
                      </span>
                    </td>
                  </tr>
                ))}
                {!topProducts.length && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-muted text-xs">
                      No product sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Low Stock Analysis */}
      {activeTab === 'low_stock' && (
        <div className="content-card">
          <div className="card-heading flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <h2>Critical Inventory Reorder Report</h2>
                <p>Products with current stock quantity ≤ 5 units</p>
              </div>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT ID</th>
                  <th>PRODUCT NAME</th>
                  <th>BRAND</th>
                  <th>PRICE</th>
                  <th>CURRENT STOCK</th>
                  <th>WARRANTY</th>
                  <th>SEVERITY</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => {
                  const isCritical = p.stock_quantity <= 2

                  return (
                    <tr key={p.product_id} className="product-row">
                      <td className="font-mono text-muted text-xs">#{p.product_id}</td>
                      <td>
                        <b className="text-white text-xs">{p.product_name}</b>
                      </td>
                      <td className="text-muted text-xs">{p.brand || '—'}</td>
                      <td className="text-white font-medium text-xs">
                        {formatCurrency(p.price)}
                      </td>
                      <td>
                        <span className={`stock-badge ${isCritical ? 'low' : 'medium'}`}>
                          {p.stock_quantity} units left
                        </span>
                      </td>
                      <td className="text-muted text-xs">{p.warranty_months} Months</td>
                      <td>
                        <span
                          className={`badge ${
                            isCritical ? 'badge-rose' : 'badge-amber'
                          }`}
                        >
                          {isCritical ? 'CRITICAL REORDER' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!lowStockProducts.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-emerald-400 text-xs">
                      ✓ No low stock products currently. All items have ample stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

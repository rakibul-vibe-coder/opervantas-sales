'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendingUp, ShoppingBag, Receipt, Scale } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getDateRange, type DatePeriod, toBengaliNumber } from '@/lib/business-date'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const PERIOD_LABELS: Record<DatePeriod, string> = {
  today: 'আজকের দিন',
  yesterday: 'গতকাল',
  this_week: 'এই সপ্তাহ',
  last_week: 'গত সপ্তাহ',
  this_month: 'এই মাস',
  last_month: 'গত মাস',
  custom: 'কাস্টম',
}

export default function ReportsAndAnalyticsPage() {
  const [period, setPeriod] = useState<DatePeriod>('this_month')
  const { start, end } = getDateRange(period)

  const { data: salesResponse, isLoading: isSalesLoading } = useQuery({
    queryKey: ['reports-sales', start, end],
    queryFn: async () => {
      const res = await fetch(`/api/sales?startDate=${start}&endDate=${end}&pageSize=100`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: expenseResponse, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['reports-expenses', start, end],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?startDate=${start}&endDate=${end}&pageSize=100`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const sales = salesResponse?.data || []
  const expenses = expenseResponse?.data || []

  // Aggregate metrics
  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total_selling_amount || 0), 0)
  const totalProfit = sales.reduce((sum: number, s: any) => sum + Number(s.gross_profit || 0), 0)
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
  const netProfit = totalProfit - totalExpenses

  // 1. Daily Sales Trend data (grouped by business_date)
  const salesByDate: Record<string, { date: string; sales: number; profit: number }> = {}
  sales.forEach((s: any) => {
    const rawDate = (s.business_date || '').slice(0, 10)
    const d = rawDate
    if (!salesByDate[d]) salesByDate[d] = { date: toBengaliNumber(rawDate.slice(5)), sales: 0, profit: 0 }
    salesByDate[d].sales += Number(s.total_selling_amount || 0)
    salesByDate[d].profit += Number(s.gross_profit || 0)
  })
  const dailyTrendData = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date))

  // 2. Salesperson Contribution data
  const contributionBySalesman: Record<string, { name: string; value: number }> = {}
  sales.forEach((s: any) => {
    const name = s.salesman_name || 'অজ্ঞাত'
    if (!contributionBySalesman[name]) contributionBySalesman[name] = { name, value: 0 }
    contributionBySalesman[name].value += Number(s.total_selling_amount || 0)
  })
  const contributionData = Object.values(contributionBySalesman)

  // 3. Sales vs Expenses by Date
  const comparisonByDate: Record<string, { date: string; sales: number; expenses: number }> = {}
  sales.forEach((s: any) => {
    const rawDate = (s.business_date || '').slice(0, 10)
    const d = toBengaliNumber(rawDate.slice(5))
    if (!comparisonByDate[d]) comparisonByDate[d] = { date: d, sales: 0, expenses: 0 }
    comparisonByDate[d].sales += Number(s.total_selling_amount || 0)
  })
  expenses.forEach((e: any) => {
    const rawDate = (e.business_date || '').slice(0, 10)
    const d = toBengaliNumber(rawDate.slice(5))
    if (!comparisonByDate[d]) comparisonByDate[d] = { date: d, sales: 0, expenses: 0 }
    comparisonByDate[d].expenses += Number(e.amount || 0)
  })
  const comparisonData = Object.values(comparisonByDate).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ব্যবসায়িক রিপোর্ট ও বিশ্লেষণ (Reports & Analytics)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            দোকানের বিক্রয়, মুনাফা, পরিচালন ব্যয় ও গ্রাফিক্যাল পারফরম্যান্স
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'] as DatePeriod[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={`whitespace-nowrap text-xs h-9 font-medium ${period === p ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="এই সময়কালের বিক্রয়"
          value={totalSales}
          isCurrency
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
          isLoading={isSalesLoading}
        />
        <MetricCard
          title="মোট গ্রস মুনাফা"
          value={totalProfit}
          isCurrency
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={isSalesLoading}
        />
        <MetricCard
          title="মোট পরিচালন ব্যয়"
          value={totalExpenses}
          isCurrency
          icon={Receipt}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-950"
          isLoading={isExpenseLoading}
        />
        <MetricCard
          title="সর্বমোট নিট মুনাফা"
          value={netProfit}
          isCurrency
          icon={Scale}
          iconColor={netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
          iconBg={netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}
          description="গ্রস মুনাফা - মোট খরচ"
          isLoading={isSalesLoading || isExpenseLoading}
        />
      </div>

      {/* Charts Row 1: Daily Sales & Profit Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Profit Line Chart */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              দৈনিক বিক্রয় ও গ্রস মুনাফার ট্রেন্ড (Line Chart)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              নির্বাচিত সময়কালে প্রতিদিনের মোট বিক্রয় বনাম গ্রস প্রফিটের গ্রাফ
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {dailyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 font-medium">
                এই নির্বাচিত সময়ে কোনো বিক্রয় তথ্য পাওয়া যায়নি
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="বিক্রয় (Sales)" stroke="#2563eb" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="profit" name="গ্রস লাভ (Profit)" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales vs Expenses Comparison */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              বিক্রয় বনাম খরচের তুলনামূলক গ্রাফ (Bar Chart)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              মোট বিক্রয় আয়ের বিপরীতে দোকানের পরিচালন ব্যয়ের অনুপাত
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {comparisonData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 font-medium">
                এই সময়ে কোনো লেনদেন বা খরচের হিসাব পাওয়া যায়নি
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="sales" name="বিক্রয় (Sales)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="খরচ (Expenses)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Salesperson Contribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              বিক্রয়কর্মীদের বিক্রয়ে অবদান (Pie/Donut Chart)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              দোকানের মোট বিক্রয়ে কোন কর্মীর শতকরা কতটুকু অবদান
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            {contributionData.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium">এই সময়কালের কোনো বিক্রয় নেই</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Salesperson Performance Bar Chart */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              কর্মীভিত্তিক মোট বিক্রয় (Horizontal Bar)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              প্রত্যেক বিক্রয়কর্মীর অর্জিত মোট বিক্রয়ের পরিমাণ
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {contributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 font-medium">
                কোনো তথ্য পাওয়া যায়নি
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" name="মোট বিক্রয়" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

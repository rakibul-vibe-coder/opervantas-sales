'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Scale,
  Package,
  Clock,
  Users,
  PlusCircle,
  Wallet,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { formatCurrency, formatTime } from '@/lib/utils'
import { getTodayBusinessDate, formatDisplayDate, toBengaliNumber } from '@/lib/business-date'

export default function ManagerDashboard() {
  const today = getTodayBusinessDate()

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary', today],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/summary?date=${today}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    refetchInterval: 10000, // Real-time poll every 10 seconds
  })

  const summary = response?.data?.summary || {
    total_sales: 0,
    total_purchase_cost: 0,
    total_gross_profit: 0,
    total_expenses: 0,
    net_profit: 0,
    total_quantity: 0,
    total_transactions: 0,
    active_salespeople: 0,
  }

  const salesmenPerformance = response?.data?.salesman_performance || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ম্যানেজার ড্যাশবোর্ড
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              লাইভ আপডেট
            </Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            হিসাবের তারিখ: <span className="font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(today)}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full font-semibold">
              (প্রতিদিন রাত ১:০০ টায় অটো রিসেট)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-10 w-10 text-slate-600 hover:text-slate-900"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>

          <Link href="/manager/add-sale">
            <Button size="sm" className="h-10 bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-medium">
              <PlusCircle className="w-4 h-4" />
              নতুন বিক্রয়
            </Button>
          </Link>

          <Link href="/manager/add-expense">
            <Button size="sm" variant="outline" className="h-10 gap-1.5 border-slate-300 font-medium">
              <Wallet className="w-4 h-4 text-rose-600" />
              নতুন খরচ
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* 1. Today's Total Sales */}
        <MetricCard
          title="আজকের মোট বিক্রয়"
          value={summary.total_sales}
          isCurrency
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
          isLoading={isLoading}
        />

        {/* 2. Today's Total Purchase Cost */}
        <MetricCard
          title="মোট ক্রয় খরচ"
          value={summary.total_purchase_cost}
          isCurrency
          icon={DollarSign}
          iconColor="text-slate-600"
          iconBg="bg-slate-100 dark:bg-slate-800"
          isLoading={isLoading}
        />

        {/* 3. Today's Gross Profit */}
        <MetricCard
          title="আজকের মোট লাভ (গ্রস)"
          value={summary.total_gross_profit}
          isCurrency
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={isLoading}
        />

        {/* 4. Today's Total Expenses */}
        <MetricCard
          title="আজকের মোট খরচ"
          value={summary.total_expenses}
          isCurrency
          icon={Receipt}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-950"
          isLoading={isLoading}
        />

        {/* 5. Today's Net Profit */}
        <MetricCard
          title="আজকের নিট লাভ"
          value={summary.net_profit}
          isCurrency
          icon={Scale}
          iconColor={summary.net_profit >= 0 ? "text-emerald-600" : "text-red-600"}
          iconBg={summary.net_profit >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}
          description="গ্রস প্রফিট - মোট খরচ"
          isLoading={isLoading}
        />

        {/* 6. Total Quantity Sold */}
        <MetricCard
          title="মোট বিক্রিত পণ্যের সংখ্যা"
          value={toBengaliNumber(summary.total_quantity) + ' টি'}
          icon={Package}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          isLoading={isLoading}
        />

        {/* 7. Number of Transactions */}
        <MetricCard
          title="মোট বিক্রয় ট্রানজেকশন"
          value={toBengaliNumber(summary.total_transactions) + ' টি'}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
          isLoading={isLoading}
        />

        {/* 8. Active Salespeople */}
        <MetricCard
          title="সক্রিয় বিক্রয়কর্মী"
          value={toBengaliNumber(summary.active_salespeople) + ' জন'}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-950"
          description="যারা আজকে বিক্রয় করেছেন"
          isLoading={isLoading}
        />
      </div>

      {/* Live Salesperson Activity Section */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              লাইভ বিক্রয়কর্মী অ্যাক্টিভিটি
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              আজকের রিয়েল-টাইম বিক্রয় ও কর্মীভিত্তিক পারফরম্যান্স
            </CardDescription>
          </div>
          <Link href="/manager/daily-performance">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-700 hover:text-blue-800 font-semibold">
              মাস্টার টেবিল <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : salesmenPerformance.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-500">আজকে এখনো কোনো বিক্রয়কর্মী বিক্রয় রেকর্ড করেননি।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesmenPerformance.map((salesman: any, idx: number) => (
                <div
                  key={salesman.salesman_id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base flex-shrink-0">
                      {salesman.salesman_name?.charAt(0) || 'ক'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{salesman.salesman_name}</p>
                        <Badge variant="outline" className="text-xs py-0 font-medium">
                          {salesman.employee_id}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {toBengaliNumber(salesman.transactions)} টি ট্রানজেকশন • {toBengaliNumber(salesman.total_quantity)} টি পণ্য বিক্রয়
                        {salesman.last_sale_at && ` • সর্বশেষ বিক্রয়: ${formatTime(salesman.last_sale_at)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 text-right pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">মোট বিক্রয়</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(Number(salesman.total_sales))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">গ্রস লাভ</p>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(salesman.gross_profit))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

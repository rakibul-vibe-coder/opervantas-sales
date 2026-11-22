'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PlusCircle, ShoppingBag, TrendingUp, Package, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getTodayBusinessDate, formatDisplayDate, toBengaliNumber } from '@/lib/business-date'

export default function SalesmanDashboard() {
  const today = getTodayBusinessDate()

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', 'today', today],
    queryFn: async () => {
      const res = await fetch(`/api/sales?startDate=${today}&endDate=${today}`)
      if (!res.ok) throw new Error('Failed to fetch sales')
      return res.json()
    },
    refetchInterval: 10000,
  })

  const sales = salesData?.data || []

  // Calculate salesman today's metrics
  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total_selling_amount || 0), 0)
  const totalProfit = sales.reduce((sum: number, s: any) => sum + Number(s.gross_profit || 0), 0)
  const totalQuantity = sales.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
  const transactions = sales.length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            বিক্রয়কর্মী ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            হিসাবের তারিখ: <span className="font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(today)}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full font-semibold">
              (প্রতিদিন রাত ১:০০ টায় অটো রিসেট)
            </span>
          </p>
        </div>
        <Link href="/salesman/add-sale">
          <Button className="w-full sm:w-auto h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold gap-2 shadow-sm">
            <PlusCircle className="w-5 h-5" />
            নতুন বিক্রয় এন্ট্রি
          </Button>
        </Link>
      </div>

      {/* 🌟 PERSISTENT TODAY'S RUNNING TOTAL HIGHLIGHT CARD */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider text-blue-200 uppercase block">
              আজকের আপনার লাইভ সেলস কাউন্টার
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              আজকের সর্বমোট বিক্রয় ও লাভ
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              আজকে আপনি যতগুলো বিক্রি করবেন, সবগুলোর স্বয়ংক্রিয় যোগফল সবসময় এখানে আপডেট থাকবে
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/15 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/20">
            <div>
              <p className="text-xs text-blue-200 font-medium">আজকের মোট বিক্রয়:</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(totalSales)}</p>
              <p className="text-[11px] text-blue-200 mt-0.5">{toBengaliNumber(transactions)} টি বিক্রয়ে {toBengaliNumber(totalQuantity)} টি পণ্য</p>
            </div>
            <div className="border-l border-white/30 pl-4">
              <p className="text-xs text-emerald-200 font-medium">আজকের মোট লাভ:</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300">+{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="আজকের মোট বিক্রয়"
          value={totalSales}
          isCurrency
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="আজকের মোট লাভ (গ্রস)"
          value={totalProfit}
          isCurrency
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="বিক্রিত পণ্যের সংখ্যা"
          value={toBengaliNumber(totalQuantity) + ' টি'}
          icon={Package}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="মোট ট্রানজেকশন"
          value={toBengaliNumber(transactions) + ' টি'}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Add CTA on Mobile */}
      <div className="sm:hidden">
        <Link href="/salesman/add-sale" className="block">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <p className="font-bold text-base">দ্রুত বিক্রয় এন্ট্রি করুন</p>
              <p className="text-xs text-blue-100">মাত্র কয়েক সেকেন্ডে পণ্যের মডেল ও দর রেকর্ড করুন</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>
      </div>

      {/* Today's Sales Activity */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              আজকের বিক্রয় তালিকা (Today&apos;s Sales)
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              বর্তমান হিসাব দিনে আপনার এন্ট্রি করা সমস্ত বিক্রয়
            </CardDescription>
          </div>
          <Link href="/salesman/my-sales">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-700 hover:text-blue-800 font-semibold">
              সকল ইতিহাস <ArrowRight className="w-4 h-4" />
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
          ) : sales.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto text-blue-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                আজকে এখনো কোনো বিক্রয় এন্ট্রি করা হয়নি।
              </p>
              <Link href="/salesman/add-sale">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white font-medium">
                  প্রথম বিক্রয় এন্ট্রি করুন
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sales.slice(0, 10).map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">{sale.model_name}</p>
                      <Badge variant="secondary" className="text-xs px-2 py-0 font-medium">
                        {toBengaliNumber(sale.quantity)} টি
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ভাউচার: {sale.sale_number} • {formatDateTime(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(sale.total_selling_amount))}
                    </p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(Number(sale.gross_profit))} লাভ
                    </p>
                  </div>
                </div>
              ))}

              {/* 🌟 BOTTOM RUNNING TOTAL FOOTER */}
              <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  আজকের সর্বমোট হিসাব ({toBengaliNumber(transactions)} টি বিক্রয়, {toBengaliNumber(totalQuantity)} টি পণ্য):
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-900 dark:text-slate-100">
                    মোট বিক্রয়: <strong className="text-blue-700 dark:text-blue-400 text-base">{formatCurrency(totalSales)}</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    মোট লাভ: <strong className="text-base">+{formatCurrency(totalProfit)}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendingUp, ShoppingBag, Package, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getDateRange, toBengaliNumber } from '@/lib/business-date'

export default function MyPerformancePage() {
  const thisMonth = getDateRange('this_month')

  const { data: monthData, isLoading } = useQuery({
    queryKey: ['sales', 'performance', 'month', thisMonth.start, thisMonth.end],
    queryFn: async () => {
      const res = await fetch(`/api/sales?startDate=${thisMonth.start}&endDate=${thisMonth.end}&pageSize=100`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const sales = monthData?.data || []
  const monthTotalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total_selling_amount || 0), 0)
  const monthTotalProfit = sales.reduce((sum: number, s: any) => sum + Number(s.gross_profit || 0), 0)
  const monthUnits = sales.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
  const monthTransactions = sales.length

  const avgProfitPerSale = monthTransactions > 0 ? monthTotalProfit / monthTransactions : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          আমার বিক্রয় পারফরম্যান্স (My Performance)
        </h1>
        <p className="text-sm text-slate-500 font-medium">চলতি মাসের ব্যক্তিগত বিক্রয় ও মুনাফার অগ্রগতি</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="চলতি মাসের মোট বিক্রয়"
          value={monthTotalSales}
          isCurrency
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="চলতি মাসের মোট লাভ"
          value={monthTotalProfit}
          isCurrency
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="মোট বিক্রিত পণ্যের সংখ্যা"
          value={toBengaliNumber(monthUnits) + ' টি'}
          icon={Package}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50 dark:bg-indigo-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="গড় লাভ (প্রতি ট্রানজেকশন)"
          value={avgProfitPerSale}
          isCurrency
          icon={Award}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
          isLoading={isLoading}
        />
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            পারফরম্যান্স সারসংক্ষেপ
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            আপনার নিষ্ঠা ও বিক্রয় দক্ষতা দোকানের সামগ্রিক অগ্রগতিতে সরাসরি ভূমিকা রাখছে।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">সম্পন্ন মোট ট্রানজেকশন সংখ্যা</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{toBengaliNumber(monthTransactions)} টি</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">গড় বিক্রয় মূল্য (প্রতি ভাউচার)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(monthTransactions > 0 ? monthTotalSales / monthTransactions : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">সামগ্রিক মুনাফার মার্জিন (%)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {toBengaliNumber(monthTotalSales > 0 ? ((monthTotalProfit / monthTotalSales) * 100).toFixed(1) : 0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

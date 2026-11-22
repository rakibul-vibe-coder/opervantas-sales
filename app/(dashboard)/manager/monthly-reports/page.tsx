'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, Receipt, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { formatCurrency } from '@/lib/utils'
import { toBengaliNumber, formatCleanBusinessDate } from '@/lib/business-date'

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

export default function MonthlyReportsPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const { data: response, isLoading } = useQuery({
    queryKey: ['monthly-report', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('Failed to fetch monthly report')
      return res.json()
    },
  })

  const dailyData = response?.data?.daily_data || []
  const totals = response?.data?.totals || {
    total_sales: 0,
    total_purchase_cost: 0,
    gross_profit: 0,
    total_expenses: 0,
    net_profit: 0,
    total_quantity: 0,
    total_transactions: 0,
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            মাসিক ব্যবসায়িক বিবরণী ও খতিয়ান
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            দিনভিত্তিক সম্পূর্ণ হিসাব ও সংরক্ষিত ব্যবসায়িক তথ্যাবলী
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            {BENGALI_MONTHS.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {toBengaliNumber(yr)} সাল
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="মাসের মোট বিক্রয়"
          value={totals.total_sales}
          isCurrency
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="মাসের মোট লাভ (গ্রস)"
          value={totals.gross_profit}
          isCurrency
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="মাসের মোট খরচ"
          value={totals.total_expenses}
          isCurrency
          icon={Receipt}
          iconColor="text-rose-600"
          iconBg="bg-rose-50 dark:bg-rose-950"
          isLoading={isLoading}
        />
        <MetricCard
          title="মাসের নিট লাভ"
          value={totals.net_profit}
          isCurrency
          icon={Scale}
          iconColor={totals.net_profit >= 0 ? "text-emerald-600" : "text-red-600"}
          iconBg={totals.net_profit >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}
          isLoading={isLoading}
        />
      </div>

      {/* Daily Breakdown Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            প্রতিদিনের পূর্ণাঙ্গ হিসাব বিবরণী ({BENGALI_MONTHS[selectedMonth - 1]} {toBengaliNumber(selectedYear)})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            নির্বাচিত মাসের প্রতিদিনের বিক্রয়, ক্রয় খরচ, পরিচালন ব্যয় ও চূড়ান্ত নিট লাভের অডিট হিসাব
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableHead className="font-bold">হিসাবের তারিখ</TableHead>
              <TableHead className="text-center font-bold">ট্রানজেকশন</TableHead>
              <TableHead className="text-center font-bold">পণ্য সংখ্যা</TableHead>
              <TableHead className="text-right font-bold">ক্রয় খরচ</TableHead>
              <TableHead className="text-right font-bold">মোট বিক্রয়</TableHead>
              <TableHead className="text-right font-bold">গ্রস মুনাফা</TableHead>
              <TableHead className="text-right font-bold">খরচ</TableHead>
              <TableHead className="text-right font-bold">নিট মুনাফা</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : dailyData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-500 font-medium">
                  {BENGALI_MONTHS[selectedMonth - 1]} {toBengaliNumber(selectedYear)} এ কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                </TableCell>
              </TableRow>
            ) : (
              dailyData.map((row: any) => (
                <TableRow key={row.business_date}>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{formatCleanBusinessDate(row.business_date)}</TableCell>
                  <TableCell className="text-center text-slate-700 dark:text-slate-300">{toBengaliNumber(row.total_transactions)}</TableCell>
                  <TableCell className="text-center text-slate-700 dark:text-slate-300">{toBengaliNumber(row.total_quantity)} টি</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {formatCurrency(Number(row.total_purchase_cost))}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(row.total_sales))}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(Number(row.gross_profit))}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 font-medium">
                    {Number(row.total_expenses) > 0 ? `-${formatCurrency(Number(row.total_expenses))}` : '৳০'}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={Number(row.net_profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                      {formatCurrency(Number(row.net_profit))}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 text-sm">
              <TableCell className="text-slate-900 dark:text-slate-100 font-bold">মাসের সর্বমোট যোগফল (TOTAL)</TableCell>
              <TableCell className="text-center">{toBengaliNumber(totals.total_transactions)}</TableCell>
              <TableCell className="text-center">{toBengaliNumber(totals.total_quantity)} টি</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.total_purchase_cost)}</TableCell>
              <TableCell className="text-right text-blue-700 dark:text-blue-400 text-base">{formatCurrency(totals.total_sales)}</TableCell>
              <TableCell className="text-right text-emerald-600 text-base">{formatCurrency(totals.gross_profit)}</TableCell>
              <TableCell className="text-right text-rose-600 text-base">{formatCurrency(totals.total_expenses)}</TableCell>
              <TableCell className="text-right text-emerald-600 text-base">{formatCurrency(totals.net_profit)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  )
}

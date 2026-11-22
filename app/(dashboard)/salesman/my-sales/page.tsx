'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getDateRange, type DatePeriod, toBengaliNumber } from '@/lib/business-date'

const PERIOD_LABELS: Record<DatePeriod, string> = {
  today: 'আজকের দিন',
  yesterday: 'গতকাল',
  this_week: 'এই সপ্তাহ',
  last_week: 'গত সপ্তাহ',
  this_month: 'এই মাস',
  last_month: 'গত মাস',
  custom: 'কাস্টম',
}

export default function MySalesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState<DatePeriod>('today')

  const { start, end } = getDateRange(period)

  const { data: response, isLoading } = useQuery({
    queryKey: ['sales', 'my', page, searchTerm, period, start, end],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(searchTerm ? { model: searchTerm } : {}),
        ...(start ? { startDate: start } : {}),
        ...(end ? { endDate: end } : {}),
      })
      const res = await fetch(`/api/sales?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch sales')
      return res.json()
    },
  })

  const sales = response?.data || []
  const pagination = response?.pagination || { page: 1, totalPages: 1, total: 0 }

  const pageTotalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total_selling_amount || 0), 0)
  const pageTotalProfit = sales.reduce((sum: number, s: any) => sum + Number(s.gross_profit || 0), 0)
  const pageTotalQuantity = sales.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            আমার বিক্রয় ইতিহাস ও সর্বমোট হিসাব
          </h1>
          <p className="text-sm text-slate-500 font-medium">আপনার এন্ট্রি করা সমস্ত বিক্রয় ট্রানজেকশনের খতিয়ান ও যোগফল</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="মডেল নাম দিয়ে খুঁজুন..."
                className="pl-9 h-10 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['today', 'yesterday', 'this_week', 'this_month'] as DatePeriod[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPeriod(p)
                    setPage(1)
                  }}
                  className={`whitespace-nowrap text-xs h-9 font-medium ${period === p ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}
                >
                  {PERIOD_LABELS[p]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableHead className="font-bold">ভাউচার #</TableHead>
              <TableHead className="font-bold">পণ্যের মডেল</TableHead>
              <TableHead className="text-center font-bold">পরিমাণ</TableHead>
              <TableHead className="text-right font-bold">বিক্রয় দর</TableHead>
              <TableHead className="text-right font-bold">মোট বিক্রয়</TableHead>
              <TableHead className="text-right font-bold">লাভ (গ্রস)</TableHead>
              <TableHead className="font-bold">হিসাব তারিখ</TableHead>
              <TableHead className="font-bold">এন্ট্রি সময়</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500 font-medium">
                  এই নির্বাচিত সময়ে আপনার কোনো বিক্রয় রেকর্ড নেই।
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold">
                    {sale.sale_number}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{sale.model_name}</TableCell>
                  <TableCell className="text-center font-bold">{toBengaliNumber(sale.quantity)} টি</TableCell>
                  <TableCell className="text-right text-slate-500">{formatCurrency(Number(sale.unit_selling_price))}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(sale.total_selling_amount))}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    +{formatCurrency(Number(sale.gross_profit))}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{toBengaliNumber(sale.business_date)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(sale.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {/* 🌟 GRAND TOTAL FOOTER */}
          {sales.length > 0 && (
            <TableFooter>
              <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold text-sm border-t-2 border-slate-300 dark:border-slate-700">
                <TableCell colSpan={2} className="text-slate-900 dark:text-slate-100 font-bold">
                  নির্বাচিত সময়ের সর্বমোট যোগফল (TOTAL)
                </TableCell>
                <TableCell className="text-center text-blue-700 dark:text-blue-400 font-bold">
                  {toBengaliNumber(pageTotalQuantity)} টি
                </TableCell>
                <TableCell className="text-right text-slate-500">—</TableCell>
                <TableCell className="text-right text-blue-700 dark:text-blue-400 text-base font-black">
                  {formatCurrency(pageTotalSales)}
                </TableCell>
                <TableCell className="text-right text-emerald-600 text-base font-black">
                  +{formatCurrency(pageTotalProfit)}
                </TableCell>
                <TableCell colSpan={2} className="text-slate-500 text-xs text-right">
                  মোট {toBengaliNumber(sales.length)} টি বিক্রয় রেকর্ড
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse" />
          ))
        ) : sales.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl text-slate-500 text-sm font-medium">
            কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <>
            {sales.map((sale: any) => (
              <Card key={sale.id} className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-blue-700 dark:text-blue-400 font-bold">{sale.sale_number}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(sale.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-base text-slate-900 dark:text-slate-100">{sale.model_name}</p>
                  <Badge variant="secondary" className="font-medium">পরিমাণ: {toBengaliNumber(sale.quantity)} টি</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">মোট বিক্রয়: </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(Number(sale.total_selling_amount))}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">লাভ: </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(Number(sale.gross_profit))}</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Mobile Running Total Banner */}
            <Card className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md rounded-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-white/20">
                <span className="text-xs font-semibold text-blue-200">নির্বাচিত সময়ের মোট যোগফল:</span>
                <span className="font-bold text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {toBengaliNumber(sales.length)} টি বিক্রয় ({toBengaliNumber(pageTotalQuantity)} টি পণ্য)
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-xs text-blue-200">মোট বিক্রয়</p>
                  <p className="text-xl font-black">{formatCurrency(pageTotalSales)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-200">মোট লাভ</p>
                  <p className="text-xl font-black text-emerald-300">+{formatCurrency(pageTotalProfit)}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages)} (মোট {toBengaliNumber(pagination.total)} টি রেকর্ড)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> পূর্ববর্তী
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="font-medium"
            >
              পরবর্তী <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

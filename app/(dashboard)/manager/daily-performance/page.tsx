'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Search, ArrowUpDown, Award, TrendingUp, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getTodayBusinessDate, formatDisplayDate, toBengaliNumber } from '@/lib/business-date'

export default function DailyPerformancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayBusinessDate())
  const [searchName, setSearchName] = useState('')
  const [sortBy, setSortBy] = useState<'profit' | 'sales' | 'transactions'>('profit')

  const { data: response, isLoading } = useQuery({
    queryKey: ['daily-performance', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/reports/daily?date=${selectedDate}`)
      if (!res.ok) throw new Error('Failed to fetch performance')
      return res.json()
    },
  })

  const rawList = response?.data?.salesman_performance || []

  // Filter by name
  const filteredList = rawList.filter((item: any) =>
    item.salesman_name?.toLowerCase().includes(searchName.toLowerCase()) ||
    item.employee_id?.toLowerCase().includes(searchName.toLowerCase())
  )

  // Sort
  const sortedList = [...filteredList].sort((a: any, b: any) => {
    if (sortBy === 'profit') return Number(b.gross_profit || 0) - Number(a.gross_profit || 0)
    if (sortBy === 'sales') return Number(b.total_sales || 0) - Number(a.total_sales || 0)
    return Number(b.transactions || 0) - Number(a.transactions || 0)
  })

  // Calculate totals
  const totalSales = rawList.reduce((sum: number, item: any) => sum + Number(item.total_sales || 0), 0)
  const totalCost = rawList.reduce((sum: number, item: any) => sum + Number(item.total_purchase_cost || 0), 0)
  const totalProfit = rawList.reduce((sum: number, item: any) => sum + Number(item.gross_profit || 0), 0)
  const totalUnits = rawList.reduce((sum: number, item: any) => sum + Number(item.total_quantity || 0), 0)
  const totalTransactions = rawList.reduce((sum: number, item: any) => sum + Number(item.transactions || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            দৈনিক বিক্রয় পারফরম্যান্স (মাস্টার টেবিল)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            সকল বিক্রয়কর্মী এবং ম্যানেজারের বিক্রয় র‍্যাংকিং — {formatDisplayDate(selectedDate)}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-auto h-10 font-medium"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(getTodayBusinessDate())}
            className="h-10 font-semibold"
          >
            আজকের দিন
          </Button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="বিক্রয়কর্মীর নাম বা আইডি দিয়ে খুঁজুন..."
              className="pl-9 h-10 placeholder:text-slate-400"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <span className="text-xs text-slate-500 font-semibold">সাজান:</span>
            <Button
              variant={sortBy === 'profit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('profit')}
              className={`text-xs h-9 font-medium ${sortBy === 'profit' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}
            >
              সর্বোচ্চ লাভ
            </Button>
            <Button
              variant={sortBy === 'sales' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('sales')}
              className={`text-xs h-9 font-medium ${sortBy === 'sales' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}
            >
              সর্বোচ্চ বিক্রয়
            </Button>
            <Button
              variant={sortBy === 'transactions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('transactions')}
              className={`text-xs h-9 font-medium ${sortBy === 'transactions' ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''}`}
            >
              ট্রানজেকশন সংখ্যা
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Master Table */}
      <Card className="hidden lg:block overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="font-bold">বিক্রয়কর্মীর নাম</TableHead>
              <TableHead className="font-bold">আইডি (ID)</TableHead>
              <TableHead className="text-center font-bold">ট্রানজেকশন</TableHead>
              <TableHead className="text-center font-bold">মোট পরিমাণ</TableHead>
              <TableHead className="text-right font-bold">ক্রয় খরচ</TableHead>
              <TableHead className="text-right font-bold">বিক্রয় মূল্য</TableHead>
              <TableHead className="text-right font-bold">গ্রস প্রফিট (লাভ)</TableHead>
              <TableHead className="text-right font-bold">অবদান (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : sortedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-500 font-medium">
                  এই নির্বাচিত তারিখে কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                </TableCell>
              </TableRow>
            ) : (
              sortedList.map((row: any) => {
                const salesShare = totalSales > 0 ? ((Number(row.total_sales || 0) / totalSales) * 100).toFixed(1) : '0'

                return (
                  <TableRow key={row.salesman_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      {row.salesman_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold">
                      {row.employee_id}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">
                      {toBengaliNumber(row.transactions)} টি
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">
                      {toBengaliNumber(row.total_quantity)} টি
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {formatCurrency(Number(row.total_purchase_cost))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(row.total_sales))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(Number(row.gross_profit))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-semibold text-xs bg-slate-50">
                        {toBengaliNumber(salesShare)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>

          {/* COMBINED TOTAL ROW */}
          <TableFooter>
            <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold text-sm border-t-2 border-slate-300 dark:border-slate-700">
              <TableCell colSpan={2} className="text-slate-900 dark:text-slate-100 font-bold">
                সারাদিনের সম্মিলিত মোট বিক্রয় ও লাভ (TOTAL)
              </TableCell>
              <TableCell className="text-center">{toBengaliNumber(totalTransactions)} টি</TableCell>
              <TableCell className="text-center">{toBengaliNumber(totalUnits)} টি</TableCell>
              <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
              <TableCell className="text-right text-blue-700 dark:text-blue-400 text-base">
                {formatCurrency(totalSales)}
              </TableCell>
              <TableCell className="text-right text-emerald-600 text-base">
                {formatCurrency(totalProfit)}
              </TableCell>
              <TableCell className="text-right">১০০%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Mobile-Friendly Performance Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse" />
          ))
        ) : sortedList.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl text-slate-500 text-sm font-medium">
            এই নির্বাচিত তারিখে কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          sortedList.map((row: any, index: number) => {
            const salesShare = totalSales > 0 ? ((Number(row.total_sales || 0) / totalSales) * 100).toFixed(1) : '0'

            return (
              <Card key={row.salesman_id} className="p-4 space-y-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-base text-slate-900 dark:text-slate-100">{row.salesman_name}</p>
                  <Badge variant="outline" className="font-mono text-xs">{row.employee_id}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 font-medium">ট্রানজেকশন: </span>
                    <strong className="text-slate-900 dark:text-slate-100">{toBengaliNumber(row.transactions)} টি</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">বিক্রিত পণ্য: </span>
                    <strong className="text-slate-900 dark:text-slate-100">{toBengaliNumber(row.total_quantity)} টি</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">মোট বিক্রয়: </span>
                    <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(Number(row.total_sales))}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">গ্রস প্রফিট: </span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(row.gross_profit))}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t">
                  <span>মোট বিক্রয়ে অবদান:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{toBengaliNumber(salesShare)}%</span>
                </div>
              </Card>
            )
          })
        )}

        {/* Mobile Combined Total Card */}
        {sortedList.length > 0 && (
          <Card className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 space-y-2.5">
            <p className="font-bold text-sm text-blue-900 dark:text-blue-200 uppercase tracking-wide">
              সারাদিনের মোট সম্মিলিত বিক্রয় ও লাভ
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium">সম্মিলিত বিক্রয়</p>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-base">{formatCurrency(totalSales)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">সম্মিলিত লাভ</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

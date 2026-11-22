'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Download, ChevronLeft, ChevronRight, Printer, Trash2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getTodayBusinessDate, getDateRange, type DatePeriod, toBengaliNumber } from '@/lib/business-date'

const PERIOD_LABELS: Record<DatePeriod | 'all', string> = {
  today: 'আজকের দিন',
  yesterday: 'গতকাল',
  this_week: 'এই সপ্তাহ',
  last_week: 'গত সপ্তাহ',
  this_month: 'এই মাস',
  last_month: 'গত মাস',
  custom: 'কাস্টম',
  all: 'সকল রেকর্ড',
}

export default function AllSalesHistoryPage() {
  const [modelSearch, setModelSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState<DatePeriod | 'all'>('today')
  const [page, setPage] = useState(1)
  const [deleteSale, setDeleteSale] = useState<any | null>(null)
  const queryClient = useQueryClient()

  const activeRange = period !== 'all' && period !== 'custom' ? getDateRange(period) : { start: startDate, end: endDate }

  const { data: response, isLoading } = useQuery({
    queryKey: ['manager-sales', page, modelSearch, activeRange.start, activeRange.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '25',
        ...(modelSearch ? { model: modelSearch } : {}),
        ...(activeRange.start ? { startDate: activeRange.start } : {}),
        ...(activeRange.end ? { endDate: activeRange.end } : {}),
      })
      const res = await fetch(`/api/sales?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch sales')
      return res.json()
    },
  })

  const sales = response?.data || []
  const pagination = response?.pagination || { page: 1, totalPages: 1, total: 0 }

  const { mutate: deleteSaleMutation, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'বিক্রয় এন্ট্রি মুছতে সমস্যা হয়েছে')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('ভুল বিক্রয় এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!', {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      })
      setDeleteSale(null)
      queryClient.invalidateQueries({ queryKey: ['manager-sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'বিক্রয় এন্ট্রি মুছতে ব্যর্থ হয়েছে')
    },
  })

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      format: 'csv',
      ...(activeRange.start ? { startDate: activeRange.start } : {}),
      ...(activeRange.end ? { endDate: activeRange.end } : {}),
    })
    window.open(`/api/export/sales?${params.toString()}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            সকল বিক্রয় ইতিহাস ও নিয়ন্ত্রণ (All Sales)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            দোকানের সমস্ত বিক্রয় রেকর্ড দেখুন এবং ভুল এন্ট্রি হলে এখান থেকে সরাসরি মুছে ফেলুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 font-medium">
            <Printer className="w-4 h-4" /> প্রিন্ট
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
            <Download className="w-4 h-4" /> সিএসভি এক্সপোর্ট (CSV)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="পণ্যের মডেল নাম দিয়ে খুঁজুন..."
                className="pl-9 h-10 placeholder:text-slate-400"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            {/* Quick Period Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['today', 'yesterday', 'this_week', 'this_month', 'all'] as (DatePeriod | 'all')[]).map((p) => (
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
      <Card className="hidden lg:block overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableHead className="font-bold">ভাউচার #</TableHead>
              <TableHead className="font-bold">তারিখ ও সময়</TableHead>
              <TableHead className="font-bold">হিসাব তারিখ</TableHead>
              <TableHead className="font-bold">বিক্রয়কর্মী</TableHead>
              <TableHead className="font-bold">পণ্যের মডেল</TableHead>
              <TableHead className="text-center font-bold">পরিমাণ</TableHead>
              <TableHead className="text-right font-bold">একক ক্রয়</TableHead>
              <TableHead className="text-right font-bold">একক বিক্রয়</TableHead>
              <TableHead className="text-right font-bold">মোট খরচ</TableHead>
              <TableHead className="text-right font-bold">মোট বিক্রয়</TableHead>
              <TableHead className="text-right font-bold">গ্রস প্রফিট</TableHead>
              <TableHead className="text-center font-bold">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={12} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-10 text-slate-500 font-medium">
                  এই ফিল্টারে কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold">
                    {sale.sale_number}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(sale.created_at)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {toBengaliNumber(sale.business_date)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{sale.salesman_name}</TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{sale.model_name}</TableCell>
                  <TableCell className="text-center font-bold">{toBengaliNumber(sale.quantity)} টি</TableCell>
                  <TableCell className="text-right text-slate-500 text-xs">
                    {formatCurrency(Number(sale.unit_purchase_price))}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-xs">
                    {formatCurrency(Number(sale.unit_selling_price))}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-xs">
                    {formatCurrency(Number(sale.total_purchase_cost))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(Number(sale.total_selling_amount))}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(Number(sale.gross_profit))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-8 px-2 text-xs gap-1 font-semibold"
                      onClick={() => setDeleteSale(sale)}
                      title="ভুল এন্ট্রি মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> মুছুন
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card List View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse" />
          ))
        ) : sales.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl text-slate-500 text-sm font-medium">
            কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          sales.map((sale: any) => (
            <Card key={sale.id} className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-700 dark:text-blue-400 font-bold">{sale.sale_number}</span>
                <span className="text-xs text-slate-500">{formatDateTime(sale.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base text-slate-900 dark:text-slate-100">{sale.model_name}</p>
                  <p className="text-xs text-slate-500">বিক্রয়কারী: <strong className="text-slate-800 dark:text-slate-200">{sale.salesman_name}</strong></p>
                </div>
                <Badge variant="secondary" className="font-medium">পরিমাণ: {toBengaliNumber(sale.quantity)} টি</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                <div>
                  <span className="text-slate-500 font-medium">মোট বিক্রয়: </span>
                  <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(Number(sale.total_selling_amount))}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">গ্রস লাভ: </span>
                  <strong className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(Number(sale.gross_profit))}</strong>
                </div>
              </div>
              <div className="pt-2 border-t flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-7 px-2.5 text-xs gap-1 font-semibold"
                  onClick={() => setDeleteSale(sale)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> ভুল এন্ট্রি মুছুন
                </Button>
              </div>
            </Card>
          ))
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSale} onOpenChange={(open) => !open && setDeleteSale(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" /> ভুল বিক্রয় এন্ট্রি মুছে ফেলা
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <span>
                আপনি কি নিশ্চিত যে আপনি ভাউচার <strong>{deleteSale?.sale_number}</strong> ({deleteSale?.model_name})-এর এই বিক্রয় এন্ট্রিটি মুছে ফেলতে চান?
              </span>
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-xs text-red-800 dark:text-red-300 space-y-1 mt-2">
                <p>• বিক্রয় মূল্য: <strong>{formatCurrency(Number(deleteSale?.total_selling_amount))}</strong></p>
                <p>• পরিমাণ: <strong>{toBengaliNumber(deleteSale?.quantity || 1)} টি</strong></p>
                <p className="font-semibold text-red-700 dark:text-red-400 mt-1">
                  ⚠️ এটি মুছে ফেললে আজকের মোট বিক্রয়, লাভ এবং ক্যাশ ব্যালেন্স থেকে এই হিসাবটি সম্পূর্ণ বাদ হয়ে যাবে।
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="font-medium">
              বাতিল
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSale && deleteSaleMutation(deleteSale.id)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              disabled={isDeleting}
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, এন্ট্রি মুছুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

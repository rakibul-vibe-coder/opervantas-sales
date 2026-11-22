'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, PlusCircle, Trash2, Download, Receipt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
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
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getTodayBusinessDate, getDateRange, type DatePeriod, toBengaliNumber } from '@/lib/business-date'
import Link from 'next/link'
import { toast } from 'sonner'

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

export default function ExpenseHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [period, setPeriod] = useState<DatePeriod | 'all'>('today')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const activeRange = period !== 'all' && period !== 'custom' ? getDateRange(period) : { start: '', end: '' }

  const { data: response, isLoading } = useQuery({
    queryKey: ['manager-expenses', searchTerm, activeRange.start, activeRange.end],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm ? { recipient: searchTerm } : {}),
        ...(activeRange.start ? { startDate: activeRange.start } : {}),
        ...(activeRange.end ? { endDate: activeRange.end } : {}),
      })
      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      return res.json()
    },
  })

  const expenses = response?.data || []
  const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  const { mutate: deleteExpense, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete expense')
      return res.json()
    },
    onSuccess: () => {
      toast.success('খরচের রেকর্ড সফলভাবে মুছে ফেলা হয়েছে')
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['manager-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
    onError: () => {
      toast.error('খরচের রেকর্ড মুছতে সমস্যা হয়েছে')
    },
  })

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      format: 'csv',
      ...(activeRange.start ? { startDate: activeRange.start } : {}),
      ...(activeRange.end ? { endDate: activeRange.end } : {}),
    })
    window.open(`/api/export/expenses?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            দৈনিক খরচের হিসাব ও ব্যবস্থাপনা
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            দোকানের সমস্ত দৈনন্দিন পরিচালন ব্যয়ের বিস্তারিত খতিয়ান
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
            <Download className="w-4 h-4" /> সিএসভি এক্সপোর্ট (CSV)
          </Button>
          <Link href="/manager/add-expense">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-medium">
              <PlusCircle className="w-4 h-4" /> নতুন খরচ যোগ করুন
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="প্রাপকের নাম দিয়ে খুঁজুন..."
                className="pl-9 h-10 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['today', 'yesterday', 'this_week', 'this_month', 'all'] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`whitespace-nowrap text-xs h-9 font-medium ${period === p ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
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
              <TableHead className="font-bold">কাকে টাকা দেওয়া হলো (প্রাপক)</TableHead>
              <TableHead className="font-bold">খরচের উদ্দেশ্য ও বিবরণ</TableHead>
              <TableHead className="text-right font-bold">টাকার পরিমাণ (৳)</TableHead>
              <TableHead className="font-bold">খরচের তারিখ</TableHead>
              <TableHead className="font-bold">হিসাব তারিখ</TableHead>
              <TableHead className="font-bold">মন্তব্য</TableHead>
              <TableHead className="w-16 text-center font-bold">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-slate-500 font-medium">
                  কোনো খরচের রেকর্ড পাওয়া যায়নি।
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense: any) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-mono text-xs text-rose-600 font-semibold">
                    {expense.expense_number}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{expense.recipient_name}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300">{expense.purpose}</TableCell>
                  <TableCell className="text-right font-bold text-rose-600">
                    {formatCurrency(Number(expense.amount))}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{toBengaliNumber(expense.expense_date)}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">{toBengaliNumber(expense.business_date)}</TableCell>
                  <TableCell className="text-xs text-slate-400">{expense.notes || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteId(expense.id)}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2">
              <TableCell colSpan={3} className="text-slate-900 dark:text-slate-100">
                এই সময়কালের সর্বমোট পরিচালন খরচ (TOTAL)
              </TableCell>
              <TableCell className="text-right text-rose-600 text-base">{formatCurrency(totalExpenseAmount)}</TableCell>
              <TableCell colSpan={4} />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse" />
          ))
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl text-slate-500 text-sm font-medium">
            এই সময়কালের কোনো খরচের হিসাব নেই।
          </div>
        ) : (
          expenses.map((expense: any) => (
            <Card key={expense.id} className="p-4 space-y-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-rose-600 font-semibold">{expense.expense_number}</span>
                <span className="text-xs text-slate-500">{toBengaliNumber(expense.expense_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base text-slate-900 dark:text-slate-100">{expense.recipient_name}</p>
                  <p className="text-xs text-slate-500">{expense.purpose}</p>
                </div>
                <p className="font-bold text-base text-rose-600">{formatCurrency(Number(expense.amount))}</p>
              </div>
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-red-500 hover:text-red-700 gap-1 font-medium"
                  onClick={() => setDeleteId(expense.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                </Button>
              </div>
            </Card>
          ))
        )}

        {/* Total Expense Card on Mobile */}
        {expenses.length > 0 && (
          <Card className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-rose-900 dark:text-rose-200">মোট খরচের যোগফল</span>
              <span className="font-bold text-base text-rose-600">{formatCurrency(totalExpenseAmount)}</span>
            </div>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              খরচের রেকর্ড মুছে ফেলার নিশ্চিতকরণ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm">
              আপনি কি নিশ্চিত যে এই খরচের রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে আপনার নিট মুনাফার হিসেবে পরিবর্তন আসবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="font-medium">
              বাতিল
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteExpense(deleteId)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              disabled={isDeleting}
            >
              {isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

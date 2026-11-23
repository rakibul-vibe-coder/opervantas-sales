'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Trash2,
  CheckCircle2,
  Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { DailyOpeningCashDialog } from '@/components/dashboard/DailyOpeningCashDialog'
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
import { formatCurrency, formatTime, formatDateTime } from '@/lib/utils'
import { getTodayBusinessDate, formatDisplayDate, toBengaliNumber } from '@/lib/business-date'

export default function ManagerDashboard() {
  const today = getTodayBusinessDate()
  const [deleteSale, setDeleteSale] = useState<any | null>(null)
  const [isCashDialogOpen, setIsCashDialogOpen] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary', today],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/summary?date=${today}`)
      if (!res.ok) throw new Error('Failed to fetch summary')
      return res.json()
    },
    refetchInterval: 10000, // Real-time poll every 10 seconds
  })

  // Fetch today's recent sales for manager deletion/review
  const { data: todaySalesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['today-recent-sales', today],
    queryFn: async () => {
      const res = await fetch(`/api/sales?startDate=${today}&endDate=${today}&pageSize=20`)
      if (!res.ok) throw new Error('Failed to fetch today sales')
      return res.json()
    },
    refetchInterval: 10000,
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
  const todaySales = todaySalesData?.data || []

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
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['today-recent-sales'] })
      queryClient.invalidateQueries({ queryKey: ['manager-sales'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'বিক্রয় এন্ট্রি মুছতে ব্যর্থ হয়েছে')
    },
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ম্যানেজার ড্যাশবোর্ড
            </h1>
            <Badge className="bg-emerald-600 text-white font-bold flex items-center gap-1.5 px-3 py-1 text-xs shadow-sm border-0">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
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

          <Button
            onClick={() => setIsCashDialogOpen(true)}
            size="sm"
            className="h-10 gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 shadow-sm"
          >
            <Coins className="w-4 h-4 text-slate-950" />
            সকালের ক্যাশ
            {Number(summary.opening_cash || 0) > 0 && (
              <span className="ml-1 bg-black/15 text-slate-950 px-2 py-0.5 rounded-full text-xs font-black">
                {formatCurrency(summary.opening_cash)}
              </span>
            )}
          </Button>

          <Link href="/manager/add-sale">
            <Button size="sm" className="h-10 bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-bold shadow-sm">
              <PlusCircle className="w-4 h-4" />
              নতুন বিক্রয়
            </Button>
          </Link>

          <Link href="/manager/add-expense">
            <Button size="sm" className="h-10 gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 font-bold px-3.5 shadow-sm">
              <Wallet className="w-4 h-4 text-rose-600" />
              নতুন খরচ
            </Button>
          </Link>
        </div>
      </div>

      {/* 🌟 CASH IN HAND HIGHLIGHT BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-white" />
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-emerald-100 uppercase">
                আজকের ক্যাশ রেজিস্টার ব্যালেন্স
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              ক্যাশে থাকা উচিত টাকা (ক্যাশ ইন হ্যান্ড)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50 font-medium">
              আজকের সকল বিক্রয় থেকে সকল দোকান খরচ বাদ দিয়ে ক্যাশ ড্রয়ারে বর্তমানে অবশিষ্ট টাকা
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Opening Cash Box */}
            <div className="bg-white/15 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/20 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-amber-200 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> সকালের প্রারম্ভিক ক্যাশ:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCashDialogOpen(true)}
                  className="text-[11px] underline text-white hover:text-amber-200 font-bold"
                >
                  {Number(summary.opening_cash || 0) > 0 ? 'পরিবর্তন' : '+ এন্ট্রি দিন'}
                </button>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {Number(summary.opening_cash || 0) > 0 ? formatCurrency(summary.opening_cash) : '৳০'}
              </p>
              <p className="text-[10px] text-emerald-100/90 font-medium">
                (ব্যবসায়িক লাভ-ক্ষতিতে যুক্ত নয়)
              </p>
            </div>

            {/* Net Sales Cash Box */}
            <div className="bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/30 text-left sm:text-right">
              <p className="text-xs text-emerald-100 font-semibold">আজকের নিট ক্যাশ (বিক্রয় − খরচ):</p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {formatCurrency(summary.net_cash_in_hand ?? (Number(summary.total_sales || 0) - Number(summary.total_expenses || 0)))}
              </p>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                (বিক্রয়: {formatCurrency(summary.total_sales)} − খরচ: {formatCurrency(summary.total_expenses)})
              </p>
            </div>
          </div>
        </div>

        {/* Total Drawer Cash Indicator when Opening Cash exists */}
        {Number(summary.opening_cash || 0) > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-100 gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              💡 ক্যাশ ড্রয়ারে সর্বমোট নগদ টাকা থাকার কথা: <strong className="text-white text-sm font-bold">{formatCurrency(Number(summary.opening_cash || 0) + Number(summary.net_cash_in_hand || 0))}</strong>
              <span className="text-[11px] opacity-85">(সকালের ক্যাশ {formatCurrency(summary.opening_cash)} + আজকের নিট ক্যাশ {formatCurrency(summary.net_cash_in_hand)})</span>
            </span>
          </div>
        )}
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

      {/* 🌟 TODAY'S SALES & DELETE SECTION (ভুল এন্ট্রি হলে তাৎক্ষণিক মুছুন) */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              আজকের বিক্রয় তালিকা (ভুল এন্ট্রি হলে ডিলিট করার সুবিধা)
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              আজকের সকল বিক্রয় এন্ট্রি লাইভ দেখুন এবং ভুল এন্ট্রি হলে সরাসরি মুছে ফেলুন
            </CardDescription>
          </div>
          <Link href="/manager/all-sales">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-700 hover:text-blue-800 font-semibold">
              সকল বিক্রয় ইতিহাস <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isSalesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : todaySales.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">
              আজকে এখনো কোনো বিক্রয় রেকর্ড এন্ট্রি করা হয়নি।
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaySales.slice(0, 8).map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{sale.model_name}</p>
                      <Badge variant="secondary" className="text-xs px-2 py-0 font-medium">
                        {toBengaliNumber(sale.quantity)} টি
                      </Badge>
                      <span className="text-xs font-mono text-blue-700 dark:text-blue-400 font-bold">
                        {sale.sale_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      বিক্রয়কারী: <strong className="text-slate-700 dark:text-slate-300">{sale.salesman_name}</strong> • সময়: {formatDateTime(sale.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(Number(sale.total_selling_amount))}
                      </p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(Number(sale.gross_profit))} লাভ
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 h-8 px-2.5 text-xs gap-1 font-semibold"
                      onClick={() => setDeleteSale(sale)}
                      title="ভুল এন্ট্রি মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> মুছুন
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <p>• বিক্রয়কারী: <strong>{deleteSale?.salesman_name}</strong></p>
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

      {/* 🌟 DAILY OPENING CASH MODAL */}
      <DailyOpeningCashDialog
        open={isCashDialogOpen}
        onOpenChange={setIsCashDialogOpen}
        currentAmount={Number(summary.opening_cash || 0)}
        currentNotes={summary.opening_cash_notes || ''}
        businessDate={today}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }}
      />
    </div>
  )
}

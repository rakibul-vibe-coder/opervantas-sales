'use client'

import { SaleEntryForm } from '@/components/sales/SaleEntryForm'
import { Clock, ShieldAlert } from 'lucide-react'
import { getTodayBusinessDate, formatDisplayDate } from '@/lib/business-date'

export default function ManagerAddSalePage() {
  const today = getTodayBusinessDate()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>বর্তমান ব্যবসায়িক হিসাব তারিখ: <strong className="text-slate-900 dark:text-slate-100">{formatDisplayDate(today)}</strong></span>
        </div>
      </div>

      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start sm:items-center gap-2 font-medium">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0 text-blue-600" />
        <span>ম্যানেজার হিসেবে আপনার এন্ট্রি করা বিক্রয় সরাসরি আপনার ম্যানেজার প্রোফাইলে রেকর্ড হবে এবং সামগ্রিক দৈনিক ব্যবসায়িক আয় ও র‍্যাংকিং তালিকায় অন্তর্ভুক্ত হবে।</span>
      </div>

      <SaleEntryForm redirectAfterSubmit="/manager" />
    </div>
  )
}

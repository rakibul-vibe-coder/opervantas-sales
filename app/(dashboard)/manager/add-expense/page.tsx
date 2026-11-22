'use client'

import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { Clock } from 'lucide-react'
import { getTodayBusinessDate, formatDisplayDate } from '@/lib/business-date'

export default function ManagerAddExpensePage() {
  const today = getTodayBusinessDate()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>বর্তমান ব্যবসায়িক হিসাব তারিখ: <strong className="text-slate-900 dark:text-slate-100">{formatDisplayDate(today)}</strong></span>
        </div>
      </div>

      <ExpenseForm onSuccess={() => setTimeout(() => { window.location.href = '/manager/expense-history' }, 1200)} />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Coins, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface DailyOpeningCashDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAmount: number
  currentNotes?: string
  businessDate: string
  onSuccess: () => void
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000]

export function DailyOpeningCashDialog({
  open,
  onOpenChange,
  currentAmount,
  currentNotes = '',
  businessDate,
  onSuccess,
}: DailyOpeningCashDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      setAmount(currentAmount > 0 ? String(currentAmount) : '')
      setNotes(currentNotes || '')
    }
  }, [open, currentAmount, currentNotes])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const parsed = Number(amount)
    if (isNaN(parsed) || parsed < 0) {
      toast.error('দয়া করে সঠিক টাকার পরিমাণ দিন')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/daily-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: businessDate,
          amount: parsed,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'ক্যাশ সংরক্ষণ করতে সমস্যা হয়েছে')
      }

      toast.success('সকালের প্রারম্ভিক ক্যাশ সফলভাবে সংরক্ষিত হয়েছে!', {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6 rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                সকালের প্রারম্ভিক ক্যাশ (Daily Opening Cash)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                দোকান খোলার পর ক্যাশ ড্রয়ারে শুরুতে কত টাকা রেখেছেন তা নির্ধারণ করুন।
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Information Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>উল্লেখ্য:</strong> এই টাকা আপনার ব্যবসায়িক বিক্রয় বা লাভ-ক্ষতির হিসাবে যোগ হবে না। এটি শুধুমাত্র ড্যাশবোর্ডে সকালের শুরুর ক্যাশ ব্যালেন্স হিসেবে দেখানো হবে।
            </p>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor="opening-cash-amount" className="text-sm font-bold text-slate-800 dark:text-slate-200">
              ক্যাশ ড্রয়ারে রাখা টাকার পরিমাণ (৳) <span className="text-rose-600">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
              <Input
                id="opening-cash-amount"
                type="number"
                min="0"
                step="any"
                placeholder="যেমন: ৫০০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-bold text-slate-900 dark:text-slate-100 h-11 border-slate-300 dark:border-slate-700 focus:border-amber-500"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amount Suggestion Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              সহজে সিলেক্ট করুন:
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +{formatCurrency(q)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('0')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
              >
                রিসেট (০)
              </button>
            </div>
          </div>

          {/* Notes input */}
          <div className="space-y-1.5">
            <Label htmlFor="opening-cash-notes" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              নোট বা বিবরণ (ঐচ্ছিক)
            </Label>
            <Input
              id="opening-cash-notes"
              type="text"
              placeholder="যেমন: খুচরা ও ভাংতি টাকার জন্য রাখা হলো"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm h-10 border-slate-300 dark:border-slate-700"
            />
          </div>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 shadow-sm"
            >
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

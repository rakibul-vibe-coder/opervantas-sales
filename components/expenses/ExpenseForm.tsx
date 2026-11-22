'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseFormSchema, type ExpenseFormInput } from '@/lib/validations/expense.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Wallet, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getTodayBusinessDate } from '@/lib/business-date'

export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const today = getTodayBusinessDate()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      recipient_name: '',
      purpose: '',
      amount: 0,
      expense_date: today,
      notes: '',
    },
  })

  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: async (data: ExpenseFormInput) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'খরচের তথ্য সংরক্ষণ করা সম্ভব হয়নি')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('দৈনিক খরচ সফলভাবে সংরক্ষণ করা হয়েছে!', {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      })
      reset({
        recipient_name: '',
        purpose: '',
        amount: 0,
        expense_date: today,
        notes: '',
      })
      queryClient.invalidateQueries({ queryKey: ['manager-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      if (onSuccess) onSuccess()
    },
    onError: (err: any) => {
      toast.error(err.message || 'খরচ এন্ট্রি ব্যর্থ হয়েছে')
    },
  })

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
            <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              দৈনিক খরচের হিসাব এন্ট্রি
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              দোকানের দৈনন্দিন পরিচালন খরচ রেকর্ড করুন
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit((d: any) => createExpense(d))} className="space-y-4">
          {/* Recipient */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient_name" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              কাকে টাকা দেওয়া হলো (Recipient Name) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipient_name"
              placeholder="যেমন: বিদ্যুৎ বিল, বাড়ির ভাড়া, চা-নাস্তা"
              className="h-11 placeholder:text-slate-400"
              disabled={isPending}
              {...register('recipient_name')}
            />
            {errors.recipient_name && (
              <p className="text-xs text-red-500 font-medium">{errors.recipient_name.message}</p>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label htmlFor="purpose" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              খরচের বিবরণ বা উদ্দেশ্য (Purpose) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="purpose"
              placeholder="যেমন: দোকানের চলতি মাসের বিদ্যুৎ বিল পরিশোধ"
              className="h-11 placeholder:text-slate-400"
              disabled={isPending}
              {...register('purpose')}
            />
            {errors.purpose && (
              <p className="text-xs text-red-500 font-medium">{errors.purpose.message}</p>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                টাকার পরিমাণ (৳) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                className="h-11 font-semibold"
                disabled={isPending}
                onFocus={(e) => e.target.select()}
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-red-500 font-medium">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expense_date" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                তারিখ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expense_date"
                type="date"
                className="h-11"
                disabled={isPending}
                {...register('expense_date')}
              />
              {errors.expense_date && (
                <p className="text-xs text-red-500 font-medium">{errors.expense_date.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              অতিরিক্ত মন্তব্য বা ভাউচার নম্বর (ঐচ্ছিক)
            </Label>
            <Input
              id="notes"
              placeholder="ভাউচার নম্বর বা রসিদের বিবরণ..."
              className="h-10 placeholder:text-slate-400"
              disabled={isPending}
              {...register('notes')}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-semibold mt-2 shadow-sm"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                সংরক্ষণ করা হচ্ছে...
              </>
            ) : (
              'খরচ সংরক্ষণ করুন'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

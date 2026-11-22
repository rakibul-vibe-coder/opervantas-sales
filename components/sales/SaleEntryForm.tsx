'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saleFormSchema, type SaleFormInput } from '@/lib/validations/sale.schema'
import { calculateGrossProfit, formatCurrency, generateIdempotencyKey } from '@/lib/utils'
import { toBengaliNumber } from '@/lib/business-date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { Loader2, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface SaleEntryFormProps {
  redirectAfterSubmit?: string
}

export function SaleEntryForm({ redirectAfterSubmit }: SaleEntryFormProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingData, setPendingData] = useState<SaleFormInput | null>(null)
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SaleFormInput>({
    resolver: zodResolver(saleFormSchema) as any,
    defaultValues: {
      model_name: '',
      quantity: 1,
      unit_purchase_price: 0,
      unit_selling_price: 0,
    },
  })

  const qty = watch('quantity') || 0
  const purchasePrice = watch('unit_purchase_price') || 0
  const sellingPrice = watch('unit_selling_price') || 0

  const { totalPurchaseCost, totalSellingAmount, grossProfit } = calculateGrossProfit(
    Number(qty),
    Number(purchasePrice),
    Number(sellingPrice)
  )

  const { mutate: submitSale, isPending } = useMutation({
    mutationFn: async (data: SaleFormInput) => {
      const idempotencyKey = generateIdempotencyKey()
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, idempotency_key: idempotencyKey }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'বিক্রয় এন্ট্রি সংরক্ষণ করা সম্ভব হয়নি')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('বিক্রয় সফলভাবে সম্পন্ন হয়েছে!', {
        description: `${pendingData?.model_name} — ${formatCurrency(totalSellingAmount)}`,
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      })
      reset({
        model_name: '',
        quantity: 1,
        unit_purchase_price: 0,
        unit_selling_price: 0,
      })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['salesman-performance'] })
      if (redirectAfterSubmit) {
        setTimeout(() => {
          window.location.href = redirectAfterSubmit
        }, 1200)
      }
    },
    onError: (error: any) => {
      toast.error('বিক্রয় এন্ট্রি ব্যর্থ হয়েছে', {
        description: error.message || 'অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      })
    },
  })

  const onSubmit = useCallback((data: SaleFormInput) => {
    setPendingData(data)
    setShowConfirm(true)
  }, [])

  const confirmSubmit = () => {
    if (pendingData) {
      submitSale(pendingData)
    }
    setShowConfirm(false)
  }

  const isValidForPreview = qty > 0 && purchasePrice >= 0 && sellingPrice >= 0

  return (
    <>
      <Card className="w-full max-w-lg mx-auto shadow-md border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                নতুন বিক্রয় এন্ট্রি
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                পণ্যের তথ্য ও দর দিয়ে বিক্রয় রেকর্ড সংরক্ষণ করুন
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Model Name */}
            <div className="space-y-1.5">
              <Label htmlFor="model_name" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                পণ্যের মডেলের নাম (Model Name) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model_name"
                placeholder="যেমন: Samsung Galaxy A55 5G"
                className="h-11 text-base placeholder:text-slate-400"
                disabled={isPending}
                {...register('model_name')}
              />
              {errors.model_name && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.model_name.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                পরিমাণ (Quantity) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                placeholder="1"
                min={1}
                className="h-11 text-base"
                disabled={isPending}
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Price Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unit_purchase_price" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  ক্রয় মূল্য (৳) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit_purchase_price"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  min={0}
                  className="h-11 text-base"
                  disabled={isPending}
                  {...register('unit_purchase_price', { valueAsNumber: true })}
                />
                {errors.unit_purchase_price && (
                  <p className="text-xs text-red-500 font-medium">{errors.unit_purchase_price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit_selling_price" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  বিক্রয় মূল্য (৳) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit_selling_price"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  min={0}
                  className="h-11 text-base"
                  disabled={isPending}
                  {...register('unit_selling_price', { valueAsNumber: true })}
                />
                {errors.unit_selling_price && (
                  <p className="text-xs text-red-500 font-medium">{errors.unit_selling_price.message}</p>
                )}
              </div>
            </div>

            {/* Live Calculation Preview */}
            {isValidForPreview && (
              <div className="bg-blue-50/70 dark:bg-slate-900/80 rounded-xl p-4 border border-blue-100 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  হিসেব পর্যালোচনা (Calculation Preview)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">মোট ক্রয় খরচ (Cost):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalPurchaseCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">মোট বিক্রয় মূল্য (Total Sale):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalSellingAmount)}
                    </span>
                  </div>
                  <Separator className="bg-blue-200 dark:bg-slate-700" />
                  <div className="flex justify-between items-center font-bold text-base">
                    <span className="text-slate-800 dark:text-slate-200">মোট লাভ (Gross Profit):</span>
                    <span className={grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                      {formatCurrency(grossProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  সাবমিট হচ্ছে...
                </>
              ) : (
                'বিক্রয় সাবমিট করুন'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              বিক্রয় নিশ্চিতকরণ
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm pt-2">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2 border">
                  <div className="flex justify-between">
                    <span className="text-slate-600">মডেল নাম:</span>
                    <span className="font-semibold text-slate-900">{pendingData?.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">পরিমাণ:</span>
                    <span className="font-semibold text-slate-900">{toBengaliNumber(pendingData?.quantity || 1)} টি</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">একক ক্রয় মূল্য:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(Number(pendingData?.unit_purchase_price))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">একক বিক্রয় মূল্য:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(Number(pendingData?.unit_selling_price))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base text-green-600">
                    <span>প্রত্যাশিত গ্রস প্রফিট:</span>
                    <span>{formatCurrency(grossProfit)}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs">
                  আপনি কি নিশ্চিত যে এই বিক্রয় রেকর্ডটি সিস্টেমে যোগ করতে চান? এটি সরাসরি দৈনিক হিসেবে অন্তর্ভুক্ত হবে।
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending} className="font-medium">
              বাতিল
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium"
              disabled={isPending}
            >
              {isPending ? 'সংরক্ষণ হচ্ছে...' : 'হ্যাঁ, নিশ্চিত করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

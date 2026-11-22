'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSalesmanSchema, type CreateSalesmanInput } from '@/lib/validations/user.schema'
import {
  Users,
  UserPlus,
  Search,
  PauseCircle,
  PlayCircle,
  Archive,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
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
import { formatDateTime } from '@/lib/utils'
import { toBengaliNumber } from '@/lib/business-date'

export default function SalesmanManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [actionUser, setActionUser] = useState<{ id: string; action: 'hold' | 'active' | 'archived'; name: string } | null>(null)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSalesmanInput>({
    resolver: zodResolver(createSalesmanSchema),
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['salesmen-list', searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/users?pageSize=100${searchTerm ? `&search=${searchTerm}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch salespeople')
      return res.json()
    },
  })

  const salespeople = (response?.data || []).filter((u: any) => u.role === 'salesman')
  const totalCount = salespeople.length
  const activeCount = salespeople.filter((u: any) => u.status === 'active').length
  const holdCount = salespeople.filter((u: any) => u.status === 'hold').length

  const { mutate: createSalesman, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateSalesmanInput) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'বিক্রয়কর্মী অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('নতুন বিক্রয়কর্মী সফলভাবে তৈরি করা হয়েছে!', {
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      })
      reset()
      setIsAddOpen(false)
      queryClient.invalidateQueries({ queryKey: ['salesmen-list'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'বিক্রয়কর্মী তৈরি ব্যর্থ হয়েছে')
    },
  })

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'hold' | 'archived' }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('স্ট্যাটাস আপডেট করা যায়নি')
      return res.json()
    },
    onSuccess: () => {
      toast.success(`অ্যাকাউন্টের স্ট্যাটাস সফলভাবে আপডেট হয়েছে`)
      setActionUser(null)
      queryClient.invalidateQueries({ queryKey: ['salesmen-list'] })
    },
    onError: () => {
      toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে')
    },
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            বিক্রয়কর্মী ব্যবস্থাপনা (Salesman Management)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            বিক্রয়কর্মীদের নতুন অ্যাকাউন্ট তৈরি, স্থিতি নিয়ন্ত্রণ ও অ্যাক্সেস নিয়ন্ত্রণ
          </p>
        </div>

        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger asChild>
            <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-semibold">
              <UserPlus className="w-4 h-4" /> নতুন বিক্রয়কর্মী যোগ করুন
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-slate-900">
                নতুন বিক্রয়কর্মী অ্যাকাউন্ট তৈরি
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500">
                সঠিক তথ্য দিয়ে নতুন বিক্রয়কর্মীর প্রোফাইল তৈরি করুন। তিনি তাৎক্ষণিকভাবে মোবাইল থেকে লগইন করতে পারবেন।
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit((d) => createSalesman(d))} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm font-semibold">
                  সম্পূর্ণ নাম <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="যেমন: মোঃ রহিম উদ্দিন"
                  disabled={isCreating}
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500 font-medium">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-semibold">
                  ইউজারনেম (Login ID) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  placeholder="যেমন: rahim_sales"
                  disabled={isCreating}
                  {...register('username')}
                />
                <p className="text-[11px] text-slate-400">শুধুমাত্র ছোট হাতের ইংরেজি বর্ণ, সংখ্যা ও আন্ডারস্কোর (_)</p>
                {errors.username && (
                  <p className="text-xs text-red-500 font-medium">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">
                  পাসওয়ার্ড <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  disabled={isCreating}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                  পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  disabled={isCreating}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold mt-4 h-11"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    অ্যাকাউন্ট তৈরি হচ্ছে...
                  </>
                ) : (
                  'অ্যাকাউন্ট সংরক্ষণ করুন'
                )}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-medium">মোট বিক্রয়কর্মী</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{toBengaliNumber(totalCount)} জন</p>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">সক্রিয় অ্যাকাউন্ট (Active)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{toBengaliNumber(activeCount)} জন</p>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">স্থগিত অ্যাকাউন্ট (On Hold)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{toBengaliNumber(holdCount)} জন</p>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="নাম বা ইউজারনেম দিয়ে বিক্রয়কর্মী খুঁজুন..."
              className="pl-9 h-10 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Salespeople Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableHead className="font-bold">এমপ্লয়ি আইডি</TableHead>
              <TableHead className="font-bold">পূর্ণ নাম</TableHead>
              <TableHead className="font-bold">ইউজারনেম</TableHead>
              <TableHead className="font-bold">অ্যাকাউন্ট স্ট্যাটাস</TableHead>
              <TableHead className="font-bold">নিবন্ধনের তারিখ</TableHead>
              <TableHead className="text-right font-bold">অ্যাকশন / নিয়ন্ত্রণ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : salespeople.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                  কোনো বিক্রয়কর্মী পাওয়া যায়নি। উপরে &quot;নতুন বিক্রয়কর্মী যোগ করুন&quot; বোতামে ক্লিক করে নতুন কর্মী তৈরি করুন।
                </TableCell>
              </TableRow>
            ) : (
              salespeople.map((person: any) => (
                <TableRow key={person.id}>
                  <TableCell className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {person.employee_id}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                    {person.full_name}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">@{person.username}</TableCell>
                  <TableCell>
                    {person.status === 'active' && <Badge variant="success">সক্রিয় (Active)</Badge>}
                    {person.status === 'hold' && <Badge variant="warning">স্থগিত (On Hold)</Badge>}
                    {person.status === 'archived' && <Badge variant="destructive">আর্কাইভড (Archived)</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(person.created_at)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {person.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-700 border-amber-300 hover:bg-amber-50 h-8 text-xs gap-1 font-medium"
                        onClick={() => setActionUser({ id: person.id, action: 'hold', name: person.full_name })}
                      >
                        <PauseCircle className="w-3.5 h-3.5" /> স্থগিত (HOLD)
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 text-xs gap-1 font-medium"
                        onClick={() => setActionUser({ id: person.id, action: 'active', name: person.full_name })}
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> চালু করুন
                      </Button>
                    )}

                    {person.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 h-8 text-xs gap-1 font-medium"
                        onClick={() => setActionUser({ id: person.id, action: 'archived', name: person.full_name })}
                      >
                        <Archive className="w-3.5 h-3.5" /> সংরক্ষণ/আর্কাইভ
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              {actionUser?.action === 'hold' && 'বিক্রয়কর্মী অ্যাকাউন্ট সাময়িক স্থগিত (HOLD)'}
              {actionUser?.action === 'active' && 'বিক্রয়কর্মী অ্যাকাউন্ট পুনরায় চালু (Activate)'}
              {actionUser?.action === 'archived' && 'বিক্রয়কর্মী অ্যাকাউন্ট আর্কাইভ (Archive)'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              {actionUser?.action === 'hold' &&
                `আপনি কি নিশ্চিত যে আপনি ${actionUser.name}-এর অ্যাকাউন্ট স্থগিত করতে চান? স্থগিত থাকা অবস্থায় তিনি সিস্টেমে লগইন বা নতুন কোনো বিক্রয় এন্ট্রি করতে পারবেন না। তার পূর্বের সকল বিক্রয় তথ্য নিরাপদে সংরক্ষিত থাকবে।`}
              {actionUser?.action === 'active' &&
                `${actionUser?.name}-এর অ্যাকাউন্ট পুনরায় চালু করতে চান? তিনি সাথে সাথেই মোবাইল থেকে লগইন করে স্বাভাবিকভাবে বিক্রয় রেকর্ড করতে পারবেন।`}
              {actionUser?.action === 'archived' &&
                `${actionUser?.name}-কে কি আর্কাইভ করতে চান? অ্যাকাউন্ট নিষ্ক্রিয় করা হলেও তার পূর্বের সকল হিসাব ও রিপোর্ট আজীবন সংরক্ষিত থাকবে।`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isUpdating} className="font-medium">
              বাতিল
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionUser && updateStatus({ id: actionUser.id, status: actionUser.action })}
              className={actionUser?.action === 'hold' ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium' : actionUser?.action === 'archived' ? 'bg-red-600 hover:bg-red-700 text-white font-medium' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium'}
              disabled={isUpdating}
            >
              {isUpdating ? 'আপডেট হচ্ছে...' : 'হ্যাঁ, নিশ্চিত করুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

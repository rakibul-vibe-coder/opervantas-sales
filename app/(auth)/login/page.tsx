'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, TrendingUp, Store } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().min(1, 'ইউজারনেম বা ইমেইল দেওয়া আবশ্যক'),
  password: z.string().min(1, 'পাসওয়ার্ড দেওয়া আবশ্যক'),
})

type LoginInput = z.infer<typeof loginSchema>

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const suspendedError = searchParams.get('error') === 'account_suspended'
  const inactiveError = searchParams.get('error') === 'account_inactive'

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as any,
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.message || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড')
        return
      }

      toast.success(`স্বাগতম, ${json.user.fullName}!`)

      const redirectTo = searchParams.get('redirectTo')
      if (redirectTo) {
        window.location.href = redirectTo
      } else if (json.user.role === 'manager') {
        window.location.href = '/manager'
      } else {
        window.location.href = '/salesman'
      }
    } catch {
      setError('ইন্টারনেট বা সার্ভার সংযোগ ত্রুটি। পুনরায় চেষ্টা করুন।')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl">
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          সিস্টেম লগইন (Login)
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          আপনার অ্যাকাউন্টে প্রবেশ করতে ইউজারনেম ও পাসওয়ার্ড দিন
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(suspendedError || inactiveError || error) && (
          <Alert variant="destructive" className="mb-4 text-sm font-medium">
            <AlertDescription>
              {suspendedError
                ? 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (HOLD) করা আছে। ম্যানেজারের সাথে যোগাযোগ করুন।'
                : inactiveError
                ? 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় বা বন্ধ করা হয়েছে।'
                : error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ইউজারনেম বা ইমেইল <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="যেমন: admin_manager বা rahim_sales"
              autoComplete="username"
              disabled={isLoading}
              className="h-11 placeholder:text-slate-400 text-base"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              পাসওয়ার্ড <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="আপনার গোপন পাসওয়ার্ড দিন"
                autoComplete="current-password"
                disabled={isLoading}
                className="h-11 pr-10 placeholder:text-slate-400 text-base"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base shadow-md transition-all mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                লগইন যাচাই হচ্ছে...
              </>
            ) : (
              'লগইন করুন'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/30 rounded-2xl backdrop-blur-md border border-blue-400/30 shadow-lg mb-1">
            <Store className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            দৈনিক বিক্রয় ও হিসাব ব্যবস্থাপনা
          </h1>
          <p className="text-blue-200 text-sm font-medium">
            মাল্টি-সেলসম্যান রিটেল শপ ম্যানেজমেন্ট সিস্টেম
          </p>
        </div>

        <Suspense fallback={<div className="h-64 bg-white/10 animate-pulse rounded-2xl" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-blue-300/80 text-xs font-medium">
          প্রতিদিন বাংলাদেশ সময় রাত ০১:০০ টায় অটোমেটিক ব্যবসায়িক হিসাব রিসেট হয়।
        </p>
      </div>
    </div>
  )
}

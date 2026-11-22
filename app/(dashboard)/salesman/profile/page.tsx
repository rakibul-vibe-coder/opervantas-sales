import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Shield, Calendar, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function SalesmanProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  const p = profile as any

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          আমার প্রোফাইল (My Profile)
        </h1>
        <p className="text-sm text-slate-500 font-medium">আপনার ব্যবহারকারী অ্যাকাউন্ট ও পরিচিতি সংক্রান্ত তথ্য</p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="text-center pb-3">
          <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-md">
            {p?.full_name?.charAt(0) || 'ক'}
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">{p?.full_name}</CardTitle>
          <CardDescription className="font-mono text-sm">@{p?.username}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Hash className="w-4 h-4 text-blue-600" /> এমপ্লয়ি আইডি (Employee ID)
            </span>
            <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">{p?.employee_id}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 text-blue-600" /> অ্যাকাউন্টের ভূমিকা (Role)
            </span>
            <Badge variant="outline" className="font-semibold">{p?.role === 'manager' ? 'ম্যানেজার' : 'বিক্রয়কর্মী'}</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 text-emerald-600" /> অ্যাকাউন্টের স্থিতি (Status)
            </span>
            <Badge variant="success" className="font-semibold">
              {p?.status === 'active' ? 'সক্রিয় (Active)' : p?.status === 'hold' ? 'স্থগিত (On Hold)' : 'আর্কাইভ'}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" /> যোগদানের তারিখ
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {p?.created_at ? formatDateTime(p.created_at) : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

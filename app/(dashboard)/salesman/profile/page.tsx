import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/profile/ProfileEditor'

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
          আমার প্রোফাইল ও ছবি (My Profile)
        </h1>
        <p className="text-sm text-slate-500 font-medium">আপনার প্রোফাইল তথ্য এবং ছবি পরিবর্তন করুন</p>
      </div>

      <ProfileEditor
        initialProfile={{
          id: p?.id || '',
          username: p?.username || '',
          full_name: p?.full_name || '',
          role: p?.role || 'salesman',
          status: p?.status || 'active',
          employee_id: p?.employee_id || '',
          avatar_url: p?.avatar_url || null,
          created_at: p?.created_at,
        }}
      />
    </div>
  )
}

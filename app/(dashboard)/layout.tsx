import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, employee_id, status')
    .eq('id', user.id)
    .single()

  const p = profile as any
  const role = p?.role || 'salesman'
  const userName = p?.full_name || 'User'
  const employeeId = p?.employee_id || 'EMP-0000'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar role={role} userName={userName} employeeId={employeeId} />
      <MobileNav role={role} userName={userName} employeeId={employeeId} />

      <main className="flex-1 min-w-0 pt-16 pb-20 lg:pt-0 lg:pb-0 px-4 py-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

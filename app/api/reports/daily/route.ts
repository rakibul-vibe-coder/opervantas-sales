import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayBusinessDate } from '@/lib/business-date'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase: any = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as any).role !== 'manager') {
      return NextResponse.json({ message: 'Manager access required' }, { status: 403 })
    }

    const date = request.nextUrl.searchParams.get('date') || getTodayBusinessDate()

    const { data: summary } = await supabase.rpc('get_dashboard_summary', { p_business_date: date })
    const { data: performance } = await supabase.rpc('get_salesman_performance', { p_business_date: date })

    return NextResponse.json({
      data: {
        date,
        summary: summary?.[0] || null,
        salesman_performance: performance || [],
      },
    })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

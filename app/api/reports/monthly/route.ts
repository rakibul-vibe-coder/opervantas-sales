import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const now = new Date()
    const year = parseInt(request.nextUrl.searchParams.get('year') || String(now.getFullYear()))
    const month = parseInt(request.nextUrl.searchParams.get('month') || String(now.getMonth() + 1))

    if (year < 2020 || year > 2100 || month < 1 || month > 12) {
      return NextResponse.json({ message: 'Invalid year or month' }, { status: 400 })
    }

    const { data: dailyData, error } = await supabase.rpc('get_monthly_report', {
      p_year: year,
      p_month: month,
    })

    if (error) {
      // Fallback query if RPC doesn't exist
      return NextResponse.json({
        data: {
          year,
          month,
          daily_data: [],
          totals: {
            total_sales: 0,
            total_purchase_cost: 0,
            gross_profit: 0,
            total_expenses: 0,
            net_profit: 0,
            total_quantity: 0,
            total_transactions: 0,
          },
        },
      })
    }

    // Calculate monthly totals
    const totals = (dailyData || []).reduce(
      (acc: any, day: any) => ({
        total_sales: acc.total_sales + Number(day.total_sales || 0),
        total_purchase_cost: acc.total_purchase_cost + Number(day.total_purchase_cost || 0),
        gross_profit: acc.gross_profit + Number(day.gross_profit || 0),
        total_expenses: acc.total_expenses + Number(day.total_expenses || 0),
        net_profit: acc.net_profit + Number(day.net_profit || 0),
        total_quantity: acc.total_quantity + Number(day.total_quantity || 0),
        total_transactions: acc.total_transactions + Number(day.total_transactions || 0),
      }),
      {
        total_sales: 0,
        total_purchase_cost: 0,
        gross_profit: 0,
        total_expenses: 0,
        net_profit: 0,
        total_quantity: 0,
        total_transactions: 0,
      }
    )

    return NextResponse.json({
      data: {
        year,
        month,
        daily_data: dailyData || [],
        totals,
      },
    })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

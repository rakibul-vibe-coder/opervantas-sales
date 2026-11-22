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

    const businessDate = request.nextUrl.searchParams.get('date') || getTodayBusinessDate()

    // Get dashboard summary using the DB function
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_dashboard_summary', { p_business_date: businessDate })

    if (summaryError) {
      // Fallback query if stored procedure isn't created yet in local dev
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('business_date', businessDate)
        .eq('status', 'active')

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('business_date', businessDate)
        .eq('status', 'active')

      const totalSales = (sales || []).reduce((sum: number, s: any) => sum + Number(s.total_selling_amount || 0), 0)
      const totalCost = (sales || []).reduce((sum: number, s: any) => sum + Number(s.total_purchase_cost || 0), 0)
      const totalProfit = (sales || []).reduce((sum: number, s: any) => sum + Number(s.gross_profit || 0), 0)
      const totalQty = (sales || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
      const totalExp = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
      const activeSalespeople = new Set((sales || []).map((s: any) => s.salesman_id)).size

      return NextResponse.json({
        data: {
          summary: {
            total_sales: totalSales,
            total_purchase_cost: totalCost,
            total_gross_profit: totalProfit,
            total_expenses: totalExp,
            net_profit: totalProfit - totalExp,
            total_quantity: totalQty,
            total_transactions: (sales || []).length,
            active_salespeople: activeSalespeople,
          },
          salesman_performance: [],
          business_date: businessDate,
        },
      })
    }

    // Get salesman performance breakdown
    const { data: performance } = await supabase
      .rpc('get_salesman_performance', { p_business_date: businessDate })

    return NextResponse.json({
      data: {
        summary: summary?.[0] || {
          total_sales: 0,
          total_purchase_cost: 0,
          total_gross_profit: 0,
          total_expenses: 0,
          net_profit: 0,
          total_quantity: 0,
          total_transactions: 0,
          active_salespeople: 0,
        },
        salesman_performance: performance || [],
        business_date: businessDate,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/summary error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    let query = supabase
      .from('sales')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('business_date', startDate)
    if (endDate) query = query.lte('business_date', endDate)

    const { data: sales, error } = await query
    if (error) throw error

    if (format === 'csv') {
      const headers = [
        'Sale ID', 'Sale Number', 'Date & Time', 'Business Date',
        'Salesman Name', 'Model Name', 'Quantity',
        'Purchase Price', 'Selling Price',
        'Total Purchase Cost', 'Total Selling Amount', 'Gross Profit',
        'Status'
      ]

      const rows = (sales || []).map((sale: any) => [
        sale.id,
        sale.sale_number,
        formatDateTime(sale.created_at),
        sale.business_date,
        sale.salesman_name,
        sale.model_name,
        sale.quantity,
        sale.unit_purchase_price,
        sale.unit_selling_price,
        sale.total_purchase_cost,
        sale.total_selling_amount,
        sale.gross_profit,
        sale.status,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sales-export-${startDate || 'all'}-to-${endDate || 'all'}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: sales })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

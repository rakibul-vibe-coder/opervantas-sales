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
      .from('expenses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('business_date', startDate)
    if (endDate) query = query.lte('business_date', endDate)

    const { data: expenses, error } = await query
    if (error) throw error

    if (format === 'csv') {
      const headers = [
        'Expense ID', 'Expense Number', 'Recipient Name', 'Purpose',
        'Amount', 'Expense Date', 'Business Date', 'Created At', 'Status', 'Notes'
      ]

      const rows = (expenses || []).map((exp: any) => [
        exp.id,
        exp.expense_number,
        exp.recipient_name,
        exp.purpose,
        exp.amount,
        exp.expense_date,
        exp.business_date,
        formatDateTime(exp.created_at),
        exp.status,
        exp.notes || '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="expenses-export-${startDate || 'all'}-to-${endDate || 'all'}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: expenses })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expenseCreateSchema } from '@/lib/validations/expense.schema'
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const offset = (page - 1) * pageSize
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const recipient = searchParams.get('recipient')
    const purpose = searchParams.get('purpose')

    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (startDate) query = query.gte('business_date', startDate)
    if (endDate) query = query.lte('business_date', endDate)
    if (recipient) query = query.ilike('recipient_name', `%${recipient}%`)
    if (purpose) query = query.ilike('purpose', `%${purpose}%`)

    const { data: expenses, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error: any) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase: any = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as any).role !== 'manager') {
      return NextResponse.json({ message: 'Manager access required' }, { status: 403 })
    }

    if ((profile as any).status !== 'active') {
      return NextResponse.json({ message: 'Account not active' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = expenseCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const data = validationResult.data
    const businessDate = getTodayBusinessDate()

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        recipient_name: data.recipient_name,
        purpose: data.purpose,
        amount: data.amount,
        expense_date: data.expense_date,
        business_date: businessDate,
        notes: data.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 })
  }
}

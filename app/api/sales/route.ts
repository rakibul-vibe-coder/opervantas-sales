import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saleCreateSchema } from '@/lib/validations/sale.schema'
import { getTodayBusinessDate } from '@/lib/business-date'

export const dynamic = 'force-dynamic'

// GET /api/sales - Paginated, filtered list of sales
export async function GET(request: NextRequest) {
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

    const p = profile as any
    if (!p || p.status !== 'active') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const offset = (page - 1) * pageSize

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const salesmanId = searchParams.get('salesmanId')
    const modelSearch = searchParams.get('model')
    const statusFilter = searchParams.get('status') || 'active'

    let query = supabase
      .from('sales')
      .select('*', { count: 'exact' })
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    // Salesmen can only see their own sales
    if (p.role === 'salesman') {
      query = query.eq('salesman_id', user.id)
    } else if (salesmanId) {
      query = query.eq('salesman_id', salesmanId)
    }

    if (startDate) query = query.gte('business_date', startDate)
    if (endDate) query = query.lte('business_date', endDate)
    if (modelSearch) query = query.ilike('model_name', `%${modelSearch}%`)

    const { data: sales, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data: sales,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('GET /api/sales error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const supabase: any = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, full_name, employee_id')
      .eq('id', user.id)
      .single()

    const p = profile as any
    if (!p) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 403 })
    }

    if (p.status !== 'active') {
      return NextResponse.json({ message: 'Your account is not active' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = saleCreateSchema.safeParse({
      model_name: body.model_name,
      quantity: body.quantity,
      unit_purchase_price: body.unit_purchase_price,
      unit_selling_price: body.unit_selling_price,
      idempotency_key: body.idempotency_key,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const data = validationResult.data

    // Server-side business date calculation — NEVER trust client
    const businessDate = getTodayBusinessDate()

    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        salesman_id: user.id,       // Always use server-side user ID
        salesman_name: p.full_name,
        model_name: data.model_name,
        quantity: data.quantity,
        unit_purchase_price: data.unit_purchase_price,
        unit_selling_price: data.unit_selling_price,
        business_date: businessDate,
        idempotency_key: data.idempotency_key,
      })
      .select()
      .single()

    if (error) {
      // Check for duplicate idempotency key (duplicate submission)
      if (error.code === '23505' && error.message?.includes('idempotency')) {
        return NextResponse.json(
          { message: 'Duplicate submission detected', code: 'DUPLICATE' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ data: sale }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/sales error:', error)
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 })
  }
}

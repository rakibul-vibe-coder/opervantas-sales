import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PATCH /api/sales/:id - Void a sale (manager only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json()

    if (body.status !== 'voided') {
      return NextResponse.json({ message: 'Only voiding is supported' }, { status: 400 })
    }

    const { data: sale, error } = await supabase
      .from('sales')
      .update({
        status: 'voided',
        voided_by: user.id,
        voided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!sale) return NextResponse.json({ message: 'Sale not found' }, { status: 404 })

    return NextResponse.json({ data: sale })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/sales/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 403 })
    }

    let query = supabase.from('sales').select('*').eq('id', id)

    // Salesmen can only view their own sales
    if ((profile as any).role === 'salesman') {
      query = query.eq('salesman_id', user.id)
    }

    const { data: sale, error } = await query.single()
    if (error || !sale) return NextResponse.json({ message: 'Sale not found' }, { status: 404 })

    return NextResponse.json({ data: sale })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expenseUpdateSchema } from '@/lib/validations/expense.schema'

export const dynamic = 'force-dynamic'

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
    const validationResult = expenseUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({ ...validationResult.data, updated_by: user.id })
      .eq('id', id)
      .eq('status', 'active')
      .select()
      .single()

    if (error) throw error
    if (!expense) return NextResponse.json({ message: 'Expense not found' }, { status: 404 })

    return NextResponse.json({ data: expense })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Soft delete
    const { data: expense, error } = await supabase
      .from('expenses')
      .update({ status: 'deleted', updated_by: user.id })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!expense) return NextResponse.json({ message: 'Expense not found' }, { status: 404 })

    return NextResponse.json({ message: 'Expense deleted', data: expense })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

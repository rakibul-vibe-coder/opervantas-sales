import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSalesmanSchema } from '@/lib/validations/user.schema'

export const dynamic = 'force-dynamic'

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

    if (!profile || (profile as any).role !== 'manager') {
      return NextResponse.json({ message: 'Manager access required' }, { status: 403 })
    }

    const { data: targetProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !targetProfile) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: targetProfile })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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
    const validationResult = updateSalesmanSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(validationResult.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!updatedProfile) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    return NextResponse.json({ data: updatedProfile })
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

    // Prevent manager from deleting themselves
    if (id === user.id) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 })
    }

    // Soft archive — never hard delete
    const { data: archived, error } = await supabase
      .from('profiles')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!archived) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    return NextResponse.json({ message: 'User archived', data: archived })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

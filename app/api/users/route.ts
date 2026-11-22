import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createSalesmanSchema } from '@/lib/validations/user.schema'

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
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: profiles, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      data: profiles,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as any).role !== 'manager') {
      return NextResponse.json({ message: 'Manager access required' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createSalesmanSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validationResult.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { full_name, username, password } = validationResult.data

    // Use admin client to bypass RLS for user creation
    const adminClient: any = createAdminClient()

    // Create auth user (using username as email prefix for uniqueness)
    const email = `${username}@salesmanager.internal`
    const { data: authData, error: authCreateError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name },
    })

    if (authCreateError) {
      if (authCreateError.message?.includes('already registered')) {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 409 }
        )
      }
      throw authCreateError
    }

    if (!authData.user) throw new Error('User creation failed')

    // Create profile record
    const { data: newProfile, error: profileError } = await adminClient
      .rpc('create_salesman_profile', {
        p_id: authData.user.id,
        p_username: username,
        p_full_name: full_name,
        p_role: 'salesman',
        p_created_by: user.id,
      })

    if (profileError) {
      // Fallback: direct insert if RPC not found
      const { data: directProfile, error: directError } = await adminClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          full_name,
          role: 'salesman',
          status: 'active',
          employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          created_by: user.id,
        })
        .select()
        .single()

      if (directError) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
        throw directError
      }

      return NextResponse.json({ data: directProfile }, { status: 201 })
    }

    return NextResponse.json({ data: newProfile }, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

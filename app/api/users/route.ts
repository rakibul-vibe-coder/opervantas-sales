import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDb } from '@/lib/db/pg'
import { hashPassword } from '@/lib/auth/session'
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
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '100'), 100)
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
  } catch (error) {
    console.error('GET /api/users error:', error)
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
    const cleanUsername = username.toLowerCase().trim()
    const db = getDb()

    // Check if username already exists
    const checkRes = await db.query(
      `SELECT id FROM profiles WHERE LOWER(username) = $1 LIMIT 1`,
      [cleanUsername]
    )
    if (checkRes.rows.length > 0) {
      return NextResponse.json(
        { message: 'এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি ইউজারনেম দিন।' },
        { status: 409 }
      )
    }

    // Generate unique employee ID
    const countRes = await db.query(`SELECT count(*) FROM profiles`)
    const empId = `EMP-${1000 + parseInt((countRes.rows[0] as any)?.count || '0') + 1}`
    const passwordHash = hashPassword(password)

    // Insert new salesman directly with password_hash
    const insertRes = await db.query(
      `INSERT INTO profiles (username, full_name, role, status, employee_id, created_by, password_hash)
       VALUES ($1, $2, 'salesman', 'active', $3, $4, $5)
       RETURNING id, username, full_name, role, status, employee_id, created_at`,
      [cleanUsername, full_name.trim(), empId, user.id, passwordHash]
    )

    return NextResponse.json({ data: insertRes.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { message: error?.message || 'বিক্রয়কর্মী অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি' },
      { status: 500 }
    )
  }
}

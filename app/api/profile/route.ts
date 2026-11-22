import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDb } from '@/lib/db/pg'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const res = await db.query(
      `SELECT id, username, full_name, role, status, employee_id, avatar_url, created_at FROM profiles WHERE id = $1`,
      [user.id]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: res.rows[0] })
  } catch (error: any) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { avatar_url, full_name } = body

    const db = getDb()

    // Update avatar and/or full name
    const updates: string[] = []
    const params: any[] = []

    if (avatar_url !== undefined) {
      params.push(avatar_url)
      updates.push(`avatar_url = $${params.length}`)
    }

    if (full_name !== undefined && typeof full_name === 'string' && full_name.trim().length > 1) {
      params.push(full_name.trim())
      updates.push(`full_name = $${params.length}`)
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    params.push(user.id)
    const sql = `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, username, full_name, role, status, employee_id, avatar_url`
    const res = await db.query(sql, params)

    return NextResponse.json({
      message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
      data: res.rows[0],
    })
  } catch (error: any) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

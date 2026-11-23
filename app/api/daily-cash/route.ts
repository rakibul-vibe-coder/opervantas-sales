import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayBusinessDate } from '@/lib/business-date'
import { getDb } from '@/lib/db/pg'

export const dynamic = 'force-dynamic'

// GET /api/daily-cash?date=YYYY-MM-DD
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

    const date = request.nextUrl.searchParams.get('date') || getTodayBusinessDate()
    const db = getDb()

    const res = await db.query(
      `SELECT id, business_date, amount, notes, updated_at 
       FROM daily_opening_cash 
       WHERE business_date = $1`,
      [date]
    )

    const record = res.rows[0] || {
      business_date: date,
      amount: 0,
      notes: '',
      updated_at: null,
    }

    return NextResponse.json({ data: record })
  } catch (error: any) {
    console.error('GET /api/daily-cash error:', error)
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/daily-cash
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
    const amount = Number(body.amount ?? 0)
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ message: 'সঠিক টাকার পরিমাণ দিন (ঋণাত্মক হতে পারবে না)' }, { status: 400 })
    }

    const businessDate = body.date || getTodayBusinessDate()
    const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

    const db = getDb()
    const upsertSql = `
      INSERT INTO daily_opening_cash (business_date, amount, notes, created_by, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (business_date)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *;
    `

    const res = await db.query(upsertSql, [businessDate, amount, notes, user.id])

    return NextResponse.json({
      message: 'সকালের প্রারম্ভিক ক্যাশ সফলভাবে সংরক্ষিত হয়েছে',
      data: res.rows[0],
    })
  } catch (error: any) {
    console.error('POST /api/daily-cash error:', error)
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 })
  }
}

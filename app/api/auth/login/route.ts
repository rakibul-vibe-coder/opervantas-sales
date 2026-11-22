import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/pg'
import { hashPassword, setSessionCookie, type SessionPayload } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    const cleanInput = String(email).trim().toLowerCase()
    const passwordHash = hashPassword(password)
    const db = getDb()

    // Query user by username or email from profiles
    const result = await db.query(
      `
      SELECT 
        id, username, full_name, role, status, employee_id, password_hash
      FROM profiles
      WHERE LOWER(username) = $1 OR LOWER(username) = LOWER(SPLIT_PART($1, '@', 1))
      LIMIT 1
      `,
      [cleanInput]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const user: any = result.rows[0]

    // Verify password hash
    if (user.password_hash !== passwordHash) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check account status
    if (user.status === 'hold') {
      return NextResponse.json(
        { message: 'Your account is on hold. Please contact your manager.', code: 'ACCOUNT_HOLD' },
        { status: 403 }
      )
    }

    if (user.status === 'archived') {
      return NextResponse.json(
        { message: 'Your account has been deactivated.', code: 'ACCOUNT_ARCHIVED' },
        { status: 403 }
      )
    }

    // Create session payload
    const sessionPayload: SessionPayload = {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
      employeeId: user.employee_id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    }

    await setSessionCookie(sessionPayload)

    return NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        employeeId: user.employee_id,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

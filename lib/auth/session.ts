import crypto from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'sales_session'
const SECRET = process.env.API_SECRET || 'sales-management-internal-secret-key-32chars'

export interface SessionPayload {
  userId: string
  username: string
  fullName: string
  role: 'manager' | 'salesman'
  status: 'active' | 'hold' | 'archived'
  employeeId: string
  expiresAt: number
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function createToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(data)
    .digest('base64url')
  return `${data}.${signature}`
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(data)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    const payload: SessionPayload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    )

    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = createToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

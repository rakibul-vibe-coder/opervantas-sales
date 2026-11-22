// lib/business-date.ts
// Business Date Logic for Asia/Dhaka timezone
// Business day resets at 1:00 AM Bangladesh time

const BUSINESS_TIMEZONE = 'Asia/Dhaka'
const BUSINESS_RESET_HOUR = 1 // 1:00 AM

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

const BANGLA_DAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
]

export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(num).replace(/[0-9]/g, (w) => bnDigits[+w])
}

/**
 * Get the current business date (server-safe, timezone-aware).
 * - If current Dhaka time is 12:00 AM - 12:59:59 AM, returns yesterday's date.
 * - Otherwise returns today's date.
 */
export function getCurrentBusinessDate(now: Date = new Date()): Date {
  const dhakaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = dhakaFormatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value)

  const dhakaDate = new Date(year, month, day)

  if (hour < BUSINESS_RESET_HOUR) {
    dhakaDate.setDate(dhakaDate.getDate() - 1)
  }

  return dhakaDate
}

/**
 * Format a business date as YYYY-MM-DD string.
 */
export function formatBusinessDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's business date as YYYY-MM-DD string.
 */
export function getTodayBusinessDate(): string {
  return formatBusinessDate(getCurrentBusinessDate())
}

/**
 * Parse a YYYY-MM-DD date string to a local Date object.
 */
export function parseBusinessDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get a human-readable display of the business date in Bengali.
 */
export function formatDisplayDate(dateString: string): string {
  if (!dateString) return ''
  const date = parseBusinessDate(dateString)
  const dayName = BANGLA_DAYS[date.getDay()]
  const monthName = BANGLA_MONTHS[date.getMonth()]
  const dayNum = toBengaliNumber(date.getDate())
  const yearNum = toBengaliNumber(date.getFullYear())
  return `${dayName}, ${dayNum} ${monthName} ${yearNum}`
}

/**
 * Get start and end dates for common report periods.
 */
export function getDateRange(period: DatePeriod): { start: string; end: string } {
  const today = getCurrentBusinessDate()
  const todayStr = formatBusinessDate(today)

  switch (period) {
    case 'today':
      return { start: todayStr, end: todayStr }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const y = formatBusinessDate(yesterday)
      return { start: y, end: y }
    }

    case 'this_week': {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      return { start: formatBusinessDate(startOfWeek), end: todayStr }
    }

    case 'last_week': {
      const startOfLastWeek = new Date(today)
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 7)
      const endOfLastWeek = new Date(startOfLastWeek)
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
      return {
        start: formatBusinessDate(startOfLastWeek),
        end: formatBusinessDate(endOfLastWeek),
      }
    }

    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: formatBusinessDate(startOfMonth), end: todayStr }
    }

    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        start: formatBusinessDate(startOfLastMonth),
        end: formatBusinessDate(endOfLastMonth),
      }
    }

    default:
      return { start: todayStr, end: todayStr }
  }
}

export type DatePeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom'

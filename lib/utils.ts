import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toBengaliNumber } from '@/lib/business-date'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Bangladesh Taka currency with BDT symbol.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '৳০'
  const formattedEnglish = amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `৳${toBengaliNumber(formattedEnglish)}`
}

/**
 * Format date for display in Bengali.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return toBengaliNumber(date.toLocaleDateString('en-GB'))
}

/**
 * Format date and time in Bengali.
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const d = toBengaliNumber(date.toLocaleDateString('en-GB'))
  const t = toBengaliNumber(
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    })
  )
  return `${d}, ${t}`
}

/**
 * Format time only in Bengali.
 */
export function formatTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return toBengaliNumber(
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dhaka',
    })
  )
}

/**
 * Calculate gross profit from quantity and prices.
 */
export function calculateGrossProfit(
  quantity: number,
  purchasePrice: number,
  sellingPrice: number
): {
  totalPurchaseCost: number
  totalSellingAmount: number
  grossProfit: number
} {
  const totalPurchaseCost = quantity * purchasePrice
  const totalSellingAmount = quantity * sellingPrice
  const grossProfit = totalSellingAmount - totalPurchaseCost
  return { totalPurchaseCost, totalSellingAmount, grossProfit }
}

/**
 * Generate a UUID for idempotency keys.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

/**
 * Calculate percentage change.
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Format a percentage for display.
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return 'প্রযোজ্য নয়'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${toBengaliNumber(value.toFixed(1))}%`
}

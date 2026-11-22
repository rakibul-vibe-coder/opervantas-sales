import { z } from 'zod'

export const expenseCreateSchema = z.object({
  recipient_name: z
    .string()
    .min(1, 'কাকে টাকা দেওয়া হলো তা উল্লেখ করুন')
    .max(200, 'নাম খুব বড়')
    .trim(),
  purpose: z
    .string()
    .min(1, 'খরচের উদ্দেশ্য বা বিবরণ লিখুন')
    .max(500, 'বিবরণ খুব বড়')
    .trim(),
  amount: z
    .number()
    .positive('টাকার পরিমাণ ০ এর বেশি হতে হবে')
    .max(9999999999, 'টাকার পরিমাণ অত্যধিক বেশি'),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'সঠিক তারিখ দিন (YYYY-MM-DD)'),
  notes: z.string().max(1000).optional(),
})

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>

export const expenseFormSchema = z.object({
  recipient_name: z.string().min(1, 'প্রাপকের নাম আবশ্যক').max(200).trim(),
  purpose: z.string().min(1, 'খরচের বিবরণ আবশ্যক').max(500).trim(),
  amount: z.number().positive('পরিমাণ ০ এর বেশি হতে হবে'),
  expense_date: z.string().min(1, 'তারিখ নির্বাচন করুন'),
  notes: z.string().max(1000).optional(),
})

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>

export const expenseUpdateSchema = expenseCreateSchema.partial()
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>

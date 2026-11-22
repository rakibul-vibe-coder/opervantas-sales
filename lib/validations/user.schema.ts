// lib/validations/user.schema.ts
import { z } from 'zod'

export const createSalesmanSchema = z.object({
  full_name: z
    .string()
    .min(2, 'সম্পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে')
    .max(100, 'নাম খুব দীর্ঘ')
    .trim(),
  username: z
    .string()
    .min(3, 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে')
    .max(50, 'ইউজারনেম খুব দীর্ঘ')
    .regex(/^[a-z0-9_]+$/, 'শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং আন্ডারস্কোর (_) ব্যবহার করুন')
    .trim(),
  email: z
    .string()
    .email('সঠিক ইমেইল ঠিকানা দিন')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    .max(100, 'পাসওয়ার্ড খুব দীর্ঘ'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'উভয় পাসওয়ার্ড একই হতে হবে',
  path: ['confirmPassword'],
})

export type CreateSalesmanInput = z.infer<typeof createSalesmanSchema>

export const updateSalesmanSchema = z.object({
  full_name: z.string().min(2).max(100).trim().optional(),
  username: z.string().min(3).max(50)
    .regex(/^[a-z0-9_]+$/)
    .trim()
    .optional(),
  status: z.enum(['active', 'hold', 'archived']).optional(),
})

export type UpdateSalesmanInput = z.infer<typeof updateSalesmanSchema>

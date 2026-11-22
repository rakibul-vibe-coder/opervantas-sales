import { z } from 'zod'

export const saleCreateSchema = z.object({
  model_name: z
    .string()
    .min(1, 'পণ্যের মডেলের নাম দেওয়া আবশ্যক')
    .max(200, 'পণ্যের নাম খুব বড়')
    .trim(),
  quantity: z
    .number()
    .int('পরিমাণ অবশ্যই পূর্ণসংখ্যা হতে হবে')
    .min(1, 'পরিমাণ কমপক্ষে ১ হতে হবে')
    .max(100000, 'পরিমাণ অত্যধিক বেশি'),
  unit_purchase_price: z
    .number()
    .min(0, 'ক্রয় মূল্য ০ বা তার বেশি হতে হবে')
    .max(9999999999, 'মূল্য অত্যধিক বেশি'),
  unit_selling_price: z
    .number()
    .min(0, 'বিক্রয় মূল্য ০ বা তার বেশি হতে হবে')
    .max(9999999999, 'মূল্য অত্যধিক বেশি'),
  idempotency_key: z
    .string()
    .uuid('অবৈধ আইডেমপোটেন্সি কি'),
})

export type SaleCreateInput = z.infer<typeof saleCreateSchema>

// Form schema with preprocessed numbers
export const saleFormSchema = z.object({
  model_name: z.string().min(1, 'পণ্যের মডেলের নাম লিখুন').max(200).trim(),
  quantity: z.number().int('পূর্ণসংখ্যা হতে হবে').min(1, 'কমপক্ষে ১ হতে হবে'),
  unit_purchase_price: z.number().min(0, 'ঋণাত্মক হতে পারবে না'),
  unit_selling_price: z.number().min(0, 'ঋণাত্মক হতে পারবে না'),
})

export type SaleFormInput = z.infer<typeof saleFormSchema>

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Clock, ShieldCheck, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          সিস্টেম সেটিংস ও কনফিগারেশন (Settings)
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          ব্যবসায়িক লজিক প্যারামিটার ও সিস্টেমের প্রযুক্তিগত বিবরণ
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            ব্যবসায়িক দিন নির্ধারণ নিয়মাবলী (Business Day Rules)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            স্বয়ংক্রিয় দৈনিক রিসেট এবং ডাটাবেজ সুরক্ষার বিস্তারিত স্পেসিফিকেশন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Globe className="w-4 h-4 text-blue-600" /> টাইমজোন (Timezone)
            </span>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Asia/Dhaka (বাংলাদেশ সময় UTC+6)</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-blue-600" /> দৈনিক হিসাব রিসেট সময়
            </span>
            <div className="text-right">
              <Badge variant="outline" className="font-semibold bg-blue-50 text-blue-700 border-blue-200">
                রাত ০১:০০:০০ ঘটিকা (বাংলাদেশ সময়)
              </Badge>
              <p className="text-[11px] text-slate-500 mt-1">
                রাত ১২:০০ থেকে ১২:৫৯:৫৯ পর্যন্ত কৃত লেনদেন পূর্ববর্তী হিসাব দিনে অন্তর্ভুক্ত হবে
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Database className="w-4 h-4 text-emerald-600" /> ডাটাবেজ ব্যাকআপ ও স্থায়িত্ব
            </span>
            <Badge variant="success" className="font-semibold">আজীবন ও অপরিবর্তনীয় (Permanent)</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> ডাটাবেজ সিকিউরিটি (RLS)
            </span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              সক্রিয় (PostgreSQL Row-Level Security)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

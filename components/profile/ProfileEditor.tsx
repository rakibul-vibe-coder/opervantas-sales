'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle2, User, Hash, Shield, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

interface ProfileEditorProps {
  initialProfile: {
    id: string
    username: string
    full_name: string
    role: string
    status: string
    employee_id: string
    avatar_url?: string | null
    created_at?: string
  }
}

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB before canvas compression
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Resize to 300x300 max for high performance & fast load
        const canvas = document.createElement('canvas')
        const MAX_DIM = 300
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

          // Save to server
          fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: dataUrl }),
          })
            .then((res) => {
              if (!res.ok) throw new Error('আপলোড ব্যর্থ হয়েছে')
              return res.json()
            })
            .then((data) => {
              setProfile((prev) => ({ ...prev, avatar_url: dataUrl }))
              toast.success('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!', {
                icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
              })
            })
            .catch(() => {
              toast.error('ছবি সংরক্ষণ করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।')
            })
            .finally(() => {
              setIsUploading(false)
            })
        } else {
          setIsUploading(false)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto overflow-hidden">
      <CardHeader className="text-center pb-4 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-slate-900/50">
        {/* Avatar with Camera Overlay */}
        <div className="relative w-28 h-28 mx-auto mb-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
            />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white dark:border-slate-800 shadow-lg">
              {profile.full_name?.charAt(0) || 'ক'}
            </div>
          )}

          {/* Upload trigger button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-all cursor-pointer"
            title="ছবি পরিবর্তন করুন"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {profile.full_name}
        </CardTitle>
        <CardDescription className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
          @{profile.username}
        </CardDescription>

        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5 text-xs h-8 border-slate-300 font-semibold text-slate-800"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            {profile.avatar_url ? 'ছবি পরিবর্তন করুন' : 'প্রোফাইল ছবি আপলোড করুন'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
            <Hash className="w-4 h-4 text-blue-600" /> এমপ্লয়ি আইডি (Employee ID)
          </span>
          <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
            {profile.employee_id}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-blue-600" /> অ্যাকাউন্টের ভূমিকা (Role)
          </span>
          <Badge className="bg-blue-600 text-white font-semibold">
            {profile.role === 'manager' ? 'স্টোর ম্যানেজার' : 'বিক্রয়কর্মী'}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" /> অ্যাকাউন্টের স্থিতি (Status)
          </span>
          <Badge className="bg-emerald-600 text-white font-semibold">
            {profile.status === 'active' ? 'সক্রিয় (Active)' : profile.status === 'hold' ? 'স্থগিত (On Hold)' : 'আর্কাইভ'}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-blue-600" /> যোগদানের তারিখ
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {profile.created_at ? formatDateTime(profile.created_at) : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

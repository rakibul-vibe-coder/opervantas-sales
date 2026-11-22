'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  History,
  Menu,
  TrendingUp,
  Wallet,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const managerBottomNav = [
  { href: '/manager', label: 'হোম', icon: LayoutDashboard, exact: true },
  { href: '/manager/add-sale', label: 'বিক্রয়', icon: PlusCircle },
  { href: '/manager/add-expense', label: 'খরচ', icon: Wallet },
  { href: '/manager/daily-performance', label: 'র‍্যাংকিং', icon: BarChart3 },
]

const salesmanBottomNav = [
  { href: '/salesman', label: 'হোম', icon: LayoutDashboard, exact: true },
  { href: '/salesman/add-sale', label: 'বিক্রয়', icon: PlusCircle },
  { href: '/salesman/my-sales', label: 'হিস্ট্রি', icon: History },
  { href: '/salesman/my-performance', label: 'হিসেব', icon: BarChart3 },
]

const managerMenuItems = [
  { href: '/manager', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/manager/add-sale', label: 'নতুন বিক্রয় এন্ট্রি', icon: PlusCircle },
  { href: '/manager/add-expense', label: 'দৈনিক খরচ এন্ট্রি', icon: Wallet },
  { href: '/manager/daily-performance', label: 'দৈনিক পারফরম্যান্স', icon: BarChart3 },
  { href: '/manager/all-sales', label: 'সকল বিক্রয় তালিকা', icon: ShoppingCart },
  { href: '/manager/expense-history', label: 'সকল খরচের তালিকা', icon: Receipt },
  { href: '/manager/salesman-management', label: 'বিক্রয়কর্মী ব্যবস্থাপনা', icon: Users },
  { href: '/manager/reports', label: 'রিপোর্ট ও অ্যানালিটিক্স', icon: TrendingUp },
  { href: '/manager/monthly-reports', label: 'মাসিক হিসেব খাতা', icon: FileText },
  { href: '/manager/profile', label: 'প্রোফাইল ও ছবি', icon: User },
  { href: '/manager/audit-logs', label: 'অডিট ও নিরাপত্তা লগ', icon: ClipboardList },
  { href: '/manager/settings', label: 'সিস্টেম সেটিংস', icon: Settings },
]

const salesmanMenuItems = [
  { href: '/salesman', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/salesman/add-sale', label: 'নতুন বিক্রয় যোগ করুন', icon: PlusCircle },
  { href: '/salesman/my-sales', label: 'আমার বিক্রয় তালিকা', icon: History },
  { href: '/salesman/my-performance', label: 'আমার পারফরম্যান্স', icon: BarChart3 },
  { href: '/salesman/profile', label: 'প্রোফাইল ও ছবি', icon: User },
]

interface MobileNavProps {
  role: 'manager' | 'salesman'
  userName: string
  employeeId: string
  avatarUrl?: string | null
}

export function MobileNav({ role, userName, employeeId, avatarUrl }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const bottomNav = role === 'manager' ? managerBottomNav : salesmanBottomNav
  const menuItems = role === 'manager' ? managerMenuItems : salesmanMenuItems

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('সফলভাবে লগআউট হয়েছেন')
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block leading-tight">সেলস ম্যানেজার</span>
            <span className="text-[10px] text-blue-400 font-mono">{employeeId}</span>
          </div>
        </div>

        {/* Menu drawer */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-slate-900 border-slate-800 text-white p-0 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                  {userName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{userName}</p>
                <p className="text-xs text-blue-400">
                  {role === 'manager' ? 'স্টোর ম্যানেজার' : 'বিক্রয়কর্মী'}
                </p>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start text-red-300 border-slate-700 bg-slate-800 hover:bg-red-950/40 hover:text-red-200 hover:border-red-900 gap-2 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                লগআউট করুন
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-inset-bottom shadow-lg">
        <div className="grid grid-cols-4 py-1">
          {bottomNav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-medium transition-colors',
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-blue-600'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

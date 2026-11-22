'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Users,
  History,
  BarChart3,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  TrendingUp,
  Wallet,
  ShoppingCart,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const managerNavItems = [
  { href: '/manager', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/manager/add-sale', label: 'নতুন বিক্রয় এন্ট্রি', icon: PlusCircle },
  { href: '/manager/add-expense', label: 'দৈনিক খরচ এন্ট্রি', icon: Wallet },
  { href: '/manager/daily-performance', label: 'দৈনিক পারফরম্যান্স', icon: BarChart3 },
  { href: '/manager/all-sales', label: 'সকল বিক্রয় তালিকা', icon: ShoppingCart },
  { href: '/manager/expense-history', label: 'সকল খরচের তালিকা', icon: Receipt },
  { href: '/manager/salesman-management', label: 'বিক্রয়কর্মী ব্যবস্থাপনা', icon: Users },
  { href: '/manager/reports', label: 'রিপোর্ট ও অ্যানালিটিক্স', icon: TrendingUp },
  { href: '/manager/monthly-reports', label: 'মাসিক হিসেব খাতা', icon: FileText },
  { href: '/manager/audit-logs', label: 'অডিট ও নিরাপত্তা লগ', icon: ClipboardList },
  { href: '/manager/settings', label: 'সিস্টেম সেটিংস', icon: Settings },
]

const salesmanNavItems = [
  { href: '/salesman', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/salesman/add-sale', label: 'নতুন বিক্রয় যোগ করুন', icon: PlusCircle },
  { href: '/salesman/my-sales', label: 'আমার বিক্রয় তালিকা', icon: History },
  { href: '/salesman/my-performance', label: 'আমার পারফরম্যান্স', icon: BarChart3 },
  { href: '/salesman/profile', label: 'প্রোফাইল', icon: User },
]

interface SidebarProps {
  role: 'manager' | 'salesman'
  userName: string
  employeeId: string
}

export function Sidebar({ role, userName, employeeId }: SidebarProps) {
  const pathname = usePathname()
  const navItems = role === 'manager' ? managerNavItems : salesmanNavItems

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('সফলভাবে লগআউট হয়েছেন')
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800 text-white flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-md">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white">সেলস ম্যানেজার</h1>
          <p className="text-blue-400 text-xs font-medium">
            {role === 'manager' ? 'ম্যানেজার প্যানেল' : 'বিক্রয়কর্মী প্যানেল'}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-white">{userName}</p>
            <p className="text-xs text-slate-400 font-mono">{employeeId}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-red-300 border-slate-700 bg-slate-800 hover:bg-red-950/40 hover:text-red-200 hover:border-red-900 gap-2 h-9 text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          লগআউট করুন
        </Button>
      </div>
    </aside>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default function AuditLogsPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/audit-logs')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const logs = response?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          নিরাপত্তা ও অডিট লগ (Security Audit Logs)
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          সিস্টেমের গুরুত্বপূর্ণ কার্যক্রম এবং নিরাপত্তার অপরিবর্তনীয় রেকর্ড
        </p>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableHead className="font-bold">তারিখ ও সময়</TableHead>
              <TableHead className="font-bold">কার্যক্রম (Action)</TableHead>
              <TableHead className="font-bold">বিভাগ / মডিউল</TableHead>
              <TableHead className="font-bold">সম্পাদনকারী</TableHead>
              <TableHead className="font-bold">বিস্তারিত তথ্য</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-12 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                  এখনো কোনো অডিট লগ রেকর্ড হয়নি।
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {log.entity_type}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {log.performed_by_name || 'সিস্টেম স্বয়ংক্রিয়'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-xs truncate font-mono">
                    {log.new_data ? JSON.stringify(log.new_data) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

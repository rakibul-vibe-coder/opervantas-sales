import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  title: string
  value: string | number
  isCurrency?: boolean
  change?: number | null
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  description?: string
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function MetricCard({
  title,
  value,
  isCurrency,
  change,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-100',
  description,
  isLoading,
  size = 'md',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 md:p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  const isPositiveChange = change !== null && change !== undefined && change > 0
  const isNegativeChange = change !== null && change !== undefined && change < 0
  const isNeutralChange = change === 0

  const displayValue = isCurrency
    ? formatCurrency(typeof value === 'number' ? value : parseFloat(String(value)) || 0)
    : value

  return (
    <Card className="overflow-hidden">
      <CardContent className={cn('p-4 md:p-5', size === 'sm' && 'p-3 md:p-4')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={cn(
              'text-muted-foreground font-medium truncate',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {title}
            </p>
            <p className={cn(
              'font-bold text-foreground mt-1 truncate',
              size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
            )}>
              {displayValue}
            </p>
            {change !== null && change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isPositiveChange && <TrendingUp className="w-3 h-3 text-green-500" />}
                {isNegativeChange && <TrendingDown className="w-3 h-3 text-red-500" />}
                {isNeutralChange && <Minus className="w-3 h-3 text-gray-400" />}
                <span className={cn(
                  'text-xs font-medium',
                  isPositiveChange && 'text-green-600',
                  isNegativeChange && 'text-red-500',
                  isNeutralChange && 'text-gray-500',
                )}>
                  {formatPercentage(change)} (গতকালের চেয়ে)
                </span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2 rounded-xl flex-shrink-0', iconBg)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

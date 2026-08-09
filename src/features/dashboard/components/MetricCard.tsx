import type { LucideIcon } from 'lucide-react'
import { formatCurrencyCO, formatNumberCO } from '../../../utils/formatters'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  format?: 'currency' | 'number'
  accent?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'
}

const accentStyles: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: 'bg-red-50', icon: 'text-primary', border: 'border-red-200' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200' },
}

export function MetricCard({
  icon: Icon, label, value, format = 'currency', accent = 'blue',
}: MetricCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.blue
  const formatted = format === 'currency' ? formatCurrencyCO(value) : formatNumberCO(value)

  return (
    <div className={`bg-white rounded-xl border ${styles.border} p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 leading-tight block">{label}</span>
          <p className={`text-base font-bold tracking-tight ${
            value < 0 ? 'text-red-600' : 'text-slate-900'
          }`}>
            {formatted}
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${styles.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${styles.icon}`} />
        </div>
      </div>
    </div>
  )
}

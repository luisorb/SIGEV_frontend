import type { LucideIcon } from 'lucide-react'
import { formatCurrencyCO, formatNumberCO } from '../../../utils/formatters'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  format?: 'currency' | 'number'
  accent?: 'red' | 'amber' | 'green' | 'slate'
}

const accentStyles: Record<string, { stripe: string; iconBg: string; icon: string }> = {
  red: { stripe: 'border-l-red-500', iconBg: 'bg-red-50', icon: 'text-red-500' },
  amber: { stripe: 'border-l-amber-500', iconBg: 'bg-amber-50', icon: 'text-amber-500' },
  green: { stripe: 'border-l-emerald-500', iconBg: 'bg-emerald-50', icon: 'text-emerald-500' },
  slate: { stripe: 'border-l-slate-400', iconBg: 'bg-slate-50', icon: 'text-slate-500' },
}

export function MetricCard({
  icon: Icon, label, value, format = 'currency', accent = 'red',
}: MetricCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.red
  const formatted = format === 'currency' ? formatCurrencyCO(value) : formatNumberCO(value)

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-[3px] ${styles.stripe} p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-tight block">
            {label}
          </span>
          <p className={`text-xl font-bold tracking-tight mt-1.5 tabular-nums ${
            value < 0 ? 'text-red-600' : 'text-slate-900'
          }`}>
            {formatted}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
      </div>
    </div>
  )
}

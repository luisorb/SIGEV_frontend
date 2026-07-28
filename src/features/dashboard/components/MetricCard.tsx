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

export function MetricCard({ icon: Icon, label, value, format = 'currency', accent = 'blue' }: MetricCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.blue

  const formatted = format === 'currency' ? formatCurrencyCO(value) : formatNumberCO(value)

  return (
    <div className={`bg-white rounded-xl border ${styles.border} p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${
        value < 0 ? 'text-red-600' : 'text-slate-900'
      }`}>
        {formatted}
      </p>
    </div>
  )
}

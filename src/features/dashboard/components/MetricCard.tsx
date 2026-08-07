import type { LucideIcon } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import { formatCurrencyCO, formatNumberCO } from '../../../utils/formatters'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  format?: 'currency' | 'number'
  accent?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'
  total?: number
}

const accentStyles: Record<string, { bg: string; icon: string; border: string; light: string }> = {
  blue: { bg: 'bg-red-50', icon: 'text-primary', border: 'border-red-200', light: '#FEE2E2' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200', light: '#D1FAE5' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200', light: '#FEF3C7' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200', light: '#E9D5FF' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200', light: '#FECDD3' },
}

const ringColors: Record<string, string> = {
  blue: '#f43340',
  emerald: '#22C55E',
  amber: '#EAB308',
  purple: '#A855F7',
  rose: '#F43F5E',
}

export function MetricCard({
  icon: Icon, label, value, format = 'currency', accent = 'blue', total,
}: MetricCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.blue
  const formatted = format === 'currency' ? formatCurrencyCO(value) : formatNumberCO(value)
  const ringColor = ringColors[accent] ?? ringColors.blue
  const remainder = total != null && total > 0 ? Math.max(0, total - value) : 0
  const showRing = total != null && total > 0

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
        <div className="flex items-center gap-2">
          {showRing && (
            <div className="w-10 h-10">
              <PieChart width={40} height={40}>
                <Pie
                  data={[
                    { name: 'valor', value },
                    { name: 'resto', value: remainder },
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={14}
                  outerRadius={18}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  <Cell fill={ringColor} />
                  <Cell fill="#F1F5F9" />
                </Pie>
              </PieChart>
            </div>
          )}
          <div className={`w-9 h-9 rounded-lg ${styles.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${styles.icon}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

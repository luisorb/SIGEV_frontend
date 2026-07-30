import { Calculator, FileText, Percent, Receipt, BadgeDollarSign } from 'lucide-react'
import type { Offer } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface OfferSummaryProps {
  offer: Offer
}

export function OfferSummary({ offer }: OfferSummaryProps) {
  const items = [
    {
      icon: Calculator,
      label: 'Base',
      value: offer.subtotal,
      accent: 'border-l-blue-500 bg-blue-50/50',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    {
      icon: Receipt,
      label: 'IVA (19%)',
      value: offer.ivaTotal,
      accent: 'border-l-purple-500 bg-purple-50/50',
      iconBg: 'bg-purple-100 text-purple-700',
    },
    {
      icon: Receipt,
      label: 'Impuesto al Consumo (8%)',
      value: offer.impuestoConsumoTotal,
      accent: 'border-l-amber-500 bg-amber-50/50',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      icon: Percent,
      label: 'Fee Técnico Administrativo (8.25%)',
      value: offer.feeTarifadoTotal,
      accent: 'border-l-teal-500 bg-teal-50/50',
      iconBg: 'bg-teal-100 text-teal-700',
    },
    {
      icon: BadgeDollarSign,
      label: 'IVA del Fee (19%)',
      value: offer.ivaFeeTotal,
      accent: 'border-l-rose-500 bg-rose-50/50',
      iconBg: 'bg-rose-100 text-rose-700',
    },
    {
      icon: FileText,
      label: 'Fee Terceros',
      value: offer.feeTercerosTotal,
      accent: 'border-l-orange-500 bg-orange-50/50',
      iconBg: 'bg-orange-100 text-orange-700',
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Resumen Económico Global</h3>
      </div>
      <div className="p-5">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 ${item.accent}`}>
              <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(item.value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between px-4 py-3 bg-slate-900 rounded-lg">
          <span className="text-sm font-semibold text-white">Total del Evento</span>
          <span className="text-lg font-bold text-white tabular-nums">{formatCurrencyCO(offer.total)}</span>
        </div>
      </div>
    </div>
  )
}

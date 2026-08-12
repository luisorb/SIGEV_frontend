import { useState } from 'react'
import { Banknote, Plus, Trash2 } from 'lucide-react'
import { usePayments, useCreatePayment, useDeletePayment } from '../../../hooks/usePayments'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import type { PaymentType } from '../../../services/types'

const PAYMENT_TYPES: PaymentType[] = ['Anticipo', 'Parcial', 'Final']

const TYPE_BADGE: Record<string, string> = {
  Anticipo: 'bg-sky-100 text-sky-800',
  Parcial: 'bg-indigo-100 text-indigo-800',
  Final: 'bg-emerald-100 text-emerald-800',
}

const STATUS_BADGE: Record<string, string> = {
  Registrado: 'bg-slate-100 text-slate-700',
  Conciliado: 'bg-green-100 text-green-800',
  Anulado: 'bg-red-100 text-red-700',
}

interface PaymentsSectionProps {
  eventId: string
  ofertaTotal: number
  defaultDisbursementId?: string
  readOnly?: boolean
}

export function PaymentsSection({
  eventId,
  ofertaTotal,
  defaultDisbursementId,
  readOnly,
}: PaymentsSectionProps) {
  const toast = useToast()
  const { can: userCan } = useRolePermissions()
  const { data: payments = [] } = usePayments(eventId)
  const { data: desembolsos = [] } = useDisbursements({ all: true })
  const createPayment = useCreatePayment()
  const deletePayment = useDeletePayment()

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<PaymentType>('Parcial')
  const [paymentDate, setPaymentDate] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canManage = !readOnly && userCan('functional_admin', 'operator')
  const paidTotal = payments
    .filter((p) => p.status !== 'Anulado')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = ofertaTotal - paidTotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.showToast('Ingrese un monto válido mayor a cero', 'error')
      return
    }
    if (value > remaining) {
      toast.showToast(
        `El monto excede el saldo disponible de la oferta económica (saldo: ${formatCurrencyCO(remaining)})`,
        'error',
      )
      return
    }
    setSubmitting(true)
    try {
      await createPayment.mutateAsync({
        eventId,
        disbursementId: defaultDisbursementId || undefined,
        amount: value,
        type,
        paymentDate: paymentDate || undefined,
        description: description.trim() || undefined,
      })
      toast.showToast('Pago registrado correctamente')
      setShowForm(false)
      setAmount('')
      setDescription('')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo registrar el pago'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este pago?')) return
    try {
      await deletePayment.mutateAsync(id)
      toast.showToast('Pago eliminado')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo eliminar el pago'), 'error')
    }
  }

  const desembolso = desembolsos.find((d) => d.id === defaultDisbursementId)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Pagos del evento
          </h2>
        </div>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar pago
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Oferta económica
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatCurrencyCO(ofertaTotal)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Total pagado
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-1">
              {formatCurrencyCO(paidTotal)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Saldo por pagar
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatCurrencyCO(remaining)}
            </p>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 border border-slate-200 rounded-xl bg-slate-50/50 p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Monto</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="0.00"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Tipo de pago</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PaymentType)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Fecha del pago</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Recurso disponible</span>
                <input
                  type="text"
                  value={desembolso?.nombre ?? 'Sin recurso asignado'}
                  disabled
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-slate-500 font-medium">Descripción</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Concepto del pago"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <Banknote className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-sm text-slate-400 mt-2">No hay pagos registrados para este evento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrado por</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${TYPE_BADGE[p.type] || 'bg-slate-100 text-slate-700'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrencyCO(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {p.paymentDate ? formatDateCO(p.paymentDate) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[220px] truncate">{p.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.createdBy?.fullName ?? '—'}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          aria-label="Eliminar pago"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

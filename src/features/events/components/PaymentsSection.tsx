import { useMemo, useState } from 'react'
import { Banknote, Plus, Trash2, Upload, Download, X, FileText } from 'lucide-react'
import { usePayments, usePaymentsSummary, useCreatePayment, useDeletePayment } from '../../../hooks/usePayments'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { Modal } from '../../../layout/Modal'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { downloadAttachment, uploadPaymentSupportApi } from '../../../services/attachments.service'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'
import type { PaymentMethod } from '../../../services/types'
import type { AttachmentResponse } from '../../../services/payments.service'
import type { Item, EventState } from '../../../types'

const STATUS_BADGE: Record<string, string> = {
  Registrado: 'bg-slate-100 text-slate-700',
  Conciliado: 'bg-green-100 text-green-800',
  Anulado: 'bg-red-100 text-red-700',
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  por_item: 'Por ítem',
  prorrateo: 'Prorrateo',
}

interface PaymentsSectionProps {
  eventId: string
  ofertaTotal: number
  defaultDisbursementId?: string
  readOnly?: boolean
  items: Item[]
  eventStatus?: EventState
  offerItems?: { descripcion: string; total: number }[]
}

interface FormItemAllocation {
  itemId: string
  amount: string
  selected: boolean
}

export function PaymentsSection({
  eventId,
  ofertaTotal,
  defaultDisbursementId,
  readOnly,
  items,
  eventStatus,
  offerItems,
}: PaymentsSectionProps) {
  const toast = useToast()
  const { can: userCan } = useRolePermissions()
  const { data: payments = [] } = usePayments(eventId)
  const { data: summary = [] } = usePaymentsSummary()
  const { data: desembolsos = [] } = useDisbursements({ all: true })
  const createPayment = useCreatePayment()
  const deletePayment = useDeletePayment()

  const [showForm, setShowForm] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('por_item')
  const [esAdicional, setEsAdicional] = useState(false)
  const [allocations, setAllocations] = useState<FormItemAllocation[]>(() =>
    items.map((i) => ({ itemId: i.id, amount: '', selected: false })),
  )
  const [prorrateoAmount, setProrrateoAmount] = useState('')
  const [description, setDescription] = useState('')
  const [supportFile, setSupportFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canManage = !readOnly && userCan('functional_admin', 'operator')
  const esEventoCerrado = eventStatus === 'Cerrado'

  const summaryRow = defaultDisbursementId
    ? summary.find((r) => r.disbursementId === defaultDisbursementId)
    : undefined

  const desembolso = desembolsos.find((d) => d.id === defaultDisbursementId)

  const valorRef = summaryRow?.valorRef ?? desembolso?.valorReferencia ?? 0
  const paidTotal = payments
    .filter((p) => p.status !== 'Anulado')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const ejecutado = summaryRow?.ejecutado ?? paidTotal
  const disponible = Math.max(0, valorRef - ejecutado)
  const pctEjecucion = summaryRow?.porcentajeEjecucion ?? (valorRef > 0 ? (ejecutado / valorRef) * 100 : 0)
  const pctParticipacion = summaryRow?.porcentajeParticipacion ?? 0

  const paidByItem = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of payments) {
      if (p.status === 'Anulado') continue
      for (const pi of p.paymentItems ?? []) {
        const current = map.get(pi.itemId) ?? 0
        map.set(pi.itemId, current + Number(pi.amount))
      }
    }
    return map
  }, [payments])

  function normalizeBudgetKey(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
  }

  const offerBudgetByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of offerItems ?? []) {
      const key = normalizeBudgetKey(item.descripcion)
      map.set(key, (map.get(key) ?? 0) + Number(item.total))
    }
    return map
  }, [offerItems])

  function itemBudget(item: Item | undefined): number {
    if (!item) return 0
    for (const key of [item.nombre, item.descripcion]) {
      if (!key) continue
      const value = offerBudgetByKey.get(normalizeBudgetKey(key))
      if (value !== undefined) return value
    }
    return item.total
  }

  const itemLabel = (id: string): string => {
    const item = items.find((i) => i.id === id)
    return item?.descripcion || id
  }

  const selectedTotal = allocations.reduce((sum, a) => {
    if (!a.selected) return sum
    const v = Number(a.amount)
    return Number.isFinite(v) ? sum + v : sum
  }, 0)

  const amountValue = method === 'por_item' ? selectedTotal : Number(prorrateoAmount)

  const prorrateoSplit = useMemo(() => {
    if (method !== 'prorrateo' || items.length === 0) return []
    const total = Number(prorrateoAmount)
    if (!Number.isFinite(total) || total <= 0) return []
    const per = Math.floor((total * 100) / items.length) / 100
    const rows = items.map(() => per)
    rows[rows.length - 1] = total - per * (items.length - 1)
    return rows.map((v, idx) => ({ itemId: items[idx].id, amount: v }))
  }, [method, items, prorrateoAmount])

  function resetForm() {
    setMethod('por_item')
    setEsAdicional(false)
    setAllocations(items.map((i) => ({ itemId: i.id, amount: '', selected: false })))
    setProrrateoAmount('')
    setDescription('')
    setSupportFile(null)
  }

  function toggleItem(itemId: string) {
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.itemId !== itemId) return a
        const item = items.find((i) => i.id === itemId)
        const pending = Math.max(0, itemBudget(item) - (paidByItem.get(itemId) ?? 0))
        return { ...a, selected: !a.selected, amount: !a.selected ? String(pending) : a.amount }
      }),
    )
  }

  function setItemAmount(itemId: string, amount: string) {
    setAllocations((prev) => prev.map((a) => (a.itemId === itemId ? { ...a, amount } : a)))
  }

  function validate(): string | null {
    if (method === 'por_item') {
      const selected = allocations.filter((a) => a.selected)
      if (selected.length === 0) return 'Seleccione al menos un ítem del evento'
      for (const a of selected) {
        const v = Number(a.amount)
        if (!Number.isFinite(v) || v <= 0) return 'Los montos por ítem deben ser mayores a cero'
        const item = items.find((i) => i.id === a.itemId)
        const pending = Math.max(0, itemBudget(item) - (paidByItem.get(a.itemId) ?? 0))
        if (v > pending + 0.009) {
          return `El monto del ítem "${itemLabel(a.itemId)}" excede su saldo pendiente`
        }
      }
    } else {
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return 'Ingrese un monto válido mayor a cero'
      }
      if (items.length === 0) return 'El evento no tiene ítems para prorratear'
    }
    if (amountValue > disponible + 0.009) {
      return `El monto excede el saldo disponible del recurso (saldo: ${formatCurrencyCO(disponible)})`
    }
    if (!supportFile) return 'Debe adjuntar el soporte documental del pago (obligatorio)'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast.showToast(error, 'error')
      return
    }
    setSubmitting(true)
    setUploading(true)
    let attachmentId: string | undefined
    try {
      if (supportFile) {
        const attachment = await uploadPaymentSupportApi(eventId, supportFile)
        attachmentId = attachment.id
      }
      if (!attachmentId) throw new Error('No se pudo cargar el soporte')
      await createPayment.mutateAsync({
        eventId,
        disbursementId: defaultDisbursementId || undefined,
        amount: amountValue,
        method,
        esAdicional: esAdicional || undefined,
        items: method === 'por_item'
          ? allocations
              .filter((a) => a.selected)
              .map((a) => ({ itemId: a.itemId, amount: Number(a.amount) }))
          : undefined,
        attachmentId,
        description: description.trim() || undefined,
      })
      toast.showToast('Pago registrado correctamente')
      setShowForm(false)
      resetForm()
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo registrar el pago'), 'error')
    } finally {
      setSubmitting(false)
      setUploading(false)
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

  async function handleDownloadSupport(attachment: AttachmentResponse) {
    try {
      await downloadAttachment(attachment.id, attachment.originalName)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo descargar el soporte'), 'error')
    }
  }

  function renderBar(value: number, color: string) {
    return (
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    )
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Valor REF del recurso
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatCurrencyCO(valorRef)}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Oferta económica
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatCurrencyCO(ofertaTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Participación: {formatPercentage(Math.min(1, pctParticipacion / 100))}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Ejecutado
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-1">
              {formatCurrencyCO(ejecutado)}
            </p>
            <div className="mt-2">{renderBar(pctEjecucion, 'bg-emerald-500')}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {formatPercentage(Math.min(1, pctEjecucion / 100))} del recurso
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Saldo disponible
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatCurrencyCO(disponible)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {payments.length === 0 ? 'Sin pagos registrados' : `${payments.length} pago${payments.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Cuánto se debe por evento
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">El evento no tiene ítems registrados.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítem</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagado</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendiente</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const paidItem = paidByItem.get(item.id) ?? 0
                    const budget = itemBudget(item)
                    const pending = Math.max(0, budget - paidItem)
                    const pct = budget > 0 ? (paidItem / budget) * 100 : 0
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-slate-700 max-w-[280px] truncate">
                          {item.descripcion || item.nombre || item.id}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-slate-900 text-right">{formatCurrencyCO(budget)}</td>
                        <td className="px-4 py-2.5 text-sm text-emerald-600 font-medium text-right">{formatCurrencyCO(paidItem)}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{formatCurrencyCO(pending)}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-500 text-right">{formatPercentage(pct / 100)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registrar pago" size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Modalidad</span>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="por_item">Por ítem</option>
                  <option value="prorrateo">Prorrateo</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">
                  Soporte documental <span className="text-red-500">*</span>
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg bg-white cursor-pointer hover:border-primary/40 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    {supportFile ? supportFile.name : 'Cargar soporte (PDF, imagen)'}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setSupportFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {supportFile && (
                    <button
                      type="button"
                      onClick={() => setSupportFile(null)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Quitar soporte"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </label>
            </div>

            {method === 'prorrateo' && (
              <label className="block sm:max-w-xs">
                <span className="text-xs text-slate-500 font-medium">Monto a prorratear entre los ítems del evento</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={prorrateoAmount}
                  onChange={(e) => setProrrateoAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="0.00"
                />
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esAdicional}
                disabled={!esEventoCerrado}
                onChange={(e) => setEsAdicional(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 disabled:opacity-40"
              />
              <span className="text-xs text-slate-600 font-medium">
                Pago adicional al cierre
              </span>
              {!esEventoCerrado && (
                <span className="text-[11px] text-slate-400">(solo disponible cuando el evento está Cerrado)</span>
              )}
            </label>

            {method === 'por_item' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">Ítems a pagar</p>
                {items.map((item) => {
                  const allocation = allocations.find((a) => a.itemId === item.id)
                  const paidItem = paidByItem.get(item.id) ?? 0
                  const pending = Math.max(0, itemBudget(item) - paidItem)
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                        allocation?.selected ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allocation?.selected ?? false}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                      />
                      <span className="flex-1 min-w-[200px] text-sm text-slate-700 truncate">
                        {item.descripcion || item.nombre || item.id}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        Pendiente: {formatCurrencyCO(pending)}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocation?.amount ?? ''}
                        disabled={!allocation?.selected}
                        onChange={(e) => setItemAmount(item.id, e.target.value)}
                        placeholder="0.00"
                        className="w-40 px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:bg-slate-50 disabled:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )
                })}
                <p className="text-xs text-slate-500">
                  Total a pagar: <span className="font-bold text-slate-900">{formatCurrencyCO(selectedTotal)}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {prorrateoSplit.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500 font-medium mb-2">Distribución sugerida ({items.length} ítems)</p>
                    <ul className="space-y-1">
                      {prorrateoSplit.map((row) => (
                        <li key={row.itemId} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 truncate pr-2">{itemLabel(row.itemId)}</span>
                          <span className="font-medium text-slate-900 whitespace-nowrap">{formatCurrencyCO(row.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

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
                {submitting ? (uploading ? 'Cargando soporte...' : 'Registrando...') : 'Registrar pago'}
              </button>
            </div>
          </form>
        </Modal>

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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modalidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítems</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Soporte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrado por</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.status === 'Anulado' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {p.method ? METHOD_LABEL[p.method] : '—'}
                      {p.esAdicional && (
                        <span className="ml-1.5 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Adicional
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate">
                      {(p.paymentItems?.length ?? 0) > 0
                        ? `${p.paymentItems!.length} ítem${p.paymentItems!.length !== 1 ? 's' : ''}`
                        : p.method === 'prorrateo' ? 'Todos los ítems' : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">{formatCurrencyCO(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(p.attachments?.length ?? 0) > 0 ? (
                        <button
                          onClick={() => handleDownloadSupport(p.attachments![0])}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                          title={p.attachments![0].originalName}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Soporte
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                          <FileText className="w-3.5 h-3.5" /> Sin soporte
                        </span>
                      )}
                    </td>
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

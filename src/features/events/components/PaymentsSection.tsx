import { useMemo, useState } from 'react'
import { Banknote, Plus, Upload, Download, FileText, Wallet, TrendingUp, PiggyBank, Receipt, AlertCircle } from 'lucide-react'
import { usePayments, usePaymentsSummary, useCreatePayment } from '../../../hooks/usePayments'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { Modal } from '../../../layout/Modal'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { downloadAttachment, uploadPaymentSupportApi } from '../../../services/attachments.service'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'
import type { PaymentMethod } from '../../../services/types'
import type { AttachmentResponse } from '../../../services/payments.service'
import type { Item } from '../../../types'

const STATUS_BADGE: Record<string, string> = {
  Registrado: 'bg-slate-100 text-slate-700',
  Conciliado: 'bg-green-100 text-green-800',
  Anulado: 'bg-red-100 text-red-700',
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  por_item: 'Por ítem',
  prorrateo: 'Por porciento',
}

function normalizeBudgetKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getItemBudget(item: Item | undefined, budgetByKey: Map<string, number>): number {
  if (!item) return 0
  for (const key of [item.nombre, item.descripcion]) {
    if (!key) continue
    const value = budgetByKey.get(normalizeBudgetKey(key))
    if (value !== undefined) return value
  }
  return item.total
}

interface PaymentsSectionProps {
  eventId: string
  defaultDisbursementId?: string
  readOnly?: boolean
  items: Item[]
  offerItems?: { descripcion: string; total: number }[]
}

interface FormItemAllocation {
  itemId: string
  amount: string
  selected: boolean
}

export function PaymentsSection({
  eventId,
  defaultDisbursementId,
  readOnly,
  items,
  offerItems,
}: PaymentsSectionProps) {
  const toast = useToast()
  const { can: userCan } = useRolePermissions()
  const { data: payments = [] } = usePayments(eventId)
  const { data: summary = [] } = usePaymentsSummary()
  const { data: desembolsos = [] } = useDisbursements({ all: true })
  const createPayment = useCreatePayment()

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

  const offerBudgetByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of offerItems ?? []) {
      const key = normalizeBudgetKey(item.descripcion)
      map.set(key, (map.get(key) ?? 0) + Number(item.total))
    }
    return map
  }, [offerItems])

  const payableItems = useMemo(
    () =>
      items.filter((item) => {
        const budget = getItemBudget(item, offerBudgetByKey)
        const paidItem = paidByItem.get(item.id) ?? 0
        return budget - paidItem > 0.009
      }),
    [items, paidByItem, offerBudgetByKey],
  )

  const [showForm, setShowForm] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('por_item')
  const [allocations, setAllocations] = useState<FormItemAllocation[]>(() =>
    payableItems.map((i) => ({ itemId: i.id, amount: '', selected: false })),
  )
  const [porcientoValue, setPorcientoValue] = useState('')
  const [description, setDescription] = useState('')
  const [supportFile, setSupportFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'debe' | 'pagos'>('debe')

  const canManage = !readOnly && userCan('functional_admin', 'operator')
  const hasApprovedOffer = useMemo(() => (offerItems ?? []).length > 0, [offerItems])
  const [showNoOfferModal, setShowNoOfferModal] = useState(false)

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

  const itemLabel = (id: string): string => {
    const item = items.find((i) => i.id === id)
    return item?.nombre || item?.descripcion || id
  }

  const selectedTotal = allocations.reduce((sum, a) => {
    if (!a.selected) return sum
    const v = Number(a.amount)
    return Number.isFinite(v) ? sum + v : sum
  }, 0)

  const porcientoSplit = useMemo(() => {
    if (method !== 'prorrateo' || payableItems.length === 0) return []
    const pct = Number(porcientoValue)
    if (!Number.isFinite(pct) || pct <= 0) return []
    return payableItems.map((item) => {
      const budget = getItemBudget(item, offerBudgetByKey)
      const alreadyPaid = paidByItem.get(item.id) ?? 0
      const pending = Math.max(0, budget - alreadyPaid)
      const amount = Math.min(Math.round(budget * (pct / 100) * 100) / 100, pending)
      return { itemId: item.id, amount, pending }
    }).filter((r) => r.amount > 0)
  }, [method, payableItems, porcientoValue, offerBudgetByKey, paidByItem])

  const amountValue = method === 'por_item' ? selectedTotal : porcientoSplit.reduce((sum, r) => sum + r.amount, 0)

  function resetForm() {
    setMethod('por_item')
    setAllocations(payableItems.map((i) => ({ itemId: i.id, amount: '', selected: false })))
    setPorcientoValue('')
    setDescription('')
    setSupportFile(null)
  }

  function openForm() {
    resetForm()
    setShowForm(true)
  }

  function closeForm() {
    resetForm()
    setShowForm(false)
  }

  function toggleItem(itemId: string) {
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.itemId !== itemId) return a
        const item = items.find((i) => i.id === itemId)
        const pending = Math.max(0, getItemBudget(item, offerBudgetByKey) - (paidByItem.get(itemId) ?? 0))
        return { ...a, selected: !a.selected, amount: !a.selected ? String(pending) : a.amount }
      }),
    )
  }

  function setItemAmount(itemId: string, amount: string) {
    setAllocations((prev) => prev.map((a) => (a.itemId === itemId ? { ...a, amount } : a)))
  }

  function validate(): string | null {
    if (method === 'por_item') {
      if (payableItems.length === 0) return 'El evento no tiene ítems pendientes por pagar'
      const selected = allocations.filter((a) => a.selected)
      if (selected.length === 0) return 'Seleccione al menos un ítem del evento'
      for (const a of selected) {
        const v = Number(a.amount)
        if (!Number.isFinite(v) || v <= 0) return 'Los montos por ítem deben ser mayores a cero'
        const item = items.find((i) => i.id === a.itemId)
        const pending = Math.max(0, getItemBudget(item, offerBudgetByKey) - (paidByItem.get(a.itemId) ?? 0))
        if (v > pending + 0.009) return `El monto del ítem "${item?.nombre || item?.descripcion || a.itemId}" excede el saldo pendiente (${formatCurrencyCO(pending)})`
      }
    } else {
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return 'Ingrese un monto válido mayor a cero'
      }
      if (payableItems.length === 0) return 'El evento no tiene ítems pendientes por pagar'
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
      const items = method === 'por_item'
        ? allocations
            .filter((a) => a.selected)
            .map((a) => ({ itemId: a.itemId, amount: Number(a.amount) }))
        : porcientoSplit.map((r) => ({ itemId: r.itemId, amount: r.amount }))
      await createPayment.mutateAsync({
        eventId,
        disbursementId: defaultDisbursementId || undefined,
        amount: amountValue,
        method,
        items,
        attachmentId,
        description: description.trim() || undefined,
      })
      toast.showToast('Pago registrado correctamente')
      closeForm()
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo registrar el pago'), 'error')
    } finally {
      setSubmitting(false)
      setUploading(false)
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
            onClick={() => {
              if (!hasApprovedOffer) {
                setShowNoOfferModal(true)
                return
              }
              openForm()
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar pago
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Valor total recurso</p>
                <p className="text-base font-bold text-slate-900">{formatCurrencyCO(valorRef)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-xl px-4 py-3.5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Ejecutado (pagos registrados)</p>
                <p className="text-base font-bold text-emerald-600">{formatCurrencyCO(ejecutado)}</p>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-medium">{formatPercentage(Math.min(1, pctEjecucion / 100))}</span>
              </div>
              {renderBar(pctEjecucion, 'bg-emerald-500')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${disponible > 0 ? 'bg-amber-50' : 'bg-slate-100'}`}>
                <PiggyBank className={`w-4 h-4 ${disponible > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Saldo disponible</p>
                <p className={`text-base font-bold ${disponible > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{formatCurrencyCO(disponible)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {payments.length === 0 ? 'Sin pagos registrados' : `${payments.filter((p) => p.status !== 'Anulado').length} pago${payments.filter((p) => p.status !== 'Anulado').length !== 1 ? 's' : ''} registrado${payments.filter((p) => p.status !== 'Anulado').length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('debe')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'debe'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            Pendiente por pagar
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
              activeTab === 'debe' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
            }`}>
              {items.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'pagos'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Pagos registrados
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
              activeTab === 'pagos' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
            }`}>
              {payments.length}
            </span>
          </button>
        </div>

        {activeTab === 'debe' && (
        <div className="mb-5">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">El evento no tiene ítems registrados.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítem</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendiente</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">Progreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const paidItem = paidByItem.get(item.id) ?? 0
                    const budget = getItemBudget(item, offerBudgetByKey)
                    const pending = Math.max(0, budget - paidItem)
                    const pct = budget > 0 ? (paidItem / budget) * 100 : 0
                    const isPaid = pct >= 100
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700 max-w-[280px] truncate">
                          {item.nombre || item.descripcion || item.id}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatCurrencyCO(budget)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600 text-right whitespace-nowrap">{formatCurrencyCO(paidItem)}</td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                          <span className={pending === 0 ? 'text-emerald-600 font-medium' : 'text-slate-600'}>
                            {formatCurrencyCO(pending)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20">
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${isPaid ? 'bg-emerald-500' : pct > 0 ? 'bg-primary' : 'bg-slate-200'}`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>
                            <span className={`text-xs font-semibold min-w-[42px] text-right ${isPaid ? 'text-emerald-600' : pct > 0 ? 'text-primary' : 'text-slate-400'}`}>
                              {formatPercentage(pct / 100)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        <Modal isOpen={showForm} onClose={closeForm} title="Registrar pago" size="xl" closeOnOverlayClick={false} closeOnEscape={false}>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Modalidad</span>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="por_item">Por ítem</option>
                  <option value="prorrateo">Por porciento</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Soporte documental <span className="text-red-500">*</span>
                </span>
                <div className="mt-1.5">
                  <label className={`flex items-center gap-2.5 px-3 py-2.5 text-sm border rounded-lg cursor-pointer transition-all ${
                    supportFile
                      ? 'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400'
                      : 'border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                  }`}>
                    {supportFile ? (
                      <span className="p-1.5 bg-emerald-100 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </span>
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 truncate">
                      {supportFile ? (
                        <span className="font-medium text-slate-900">{supportFile.name}</span>
                      ) : (
                        <span className="text-slate-400">Seleccionar archivo...</span>
                      )}
                    </span>
                    {supportFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSupportFile(null) }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 shrink-0"
                      >
                        Quitar
                      </button>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setSupportFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {supportFile && (
                    <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                      Listo para adjuntar
                    </p>
                  )}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Descripción</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                placeholder="Concepto del pago"
              />
            </label>

            {method === 'prorrateo' && (
              <div className="bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-200">
                <label className="block">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Porciento a prorratear</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Se aplica sobre el valor total de cada ítem pendiente</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={porcientoValue}
                      onChange={(e) => setPorcientoValue(e.target.value)}
                      className="w-32 px-3 py-2.5 text-lg font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-center"
                      placeholder="0"
                    />
                    <span className="text-lg font-bold text-slate-400">%</span>
                  </div>
                </label>
              </div>
            )}

            {method === 'por_item' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ítems a pagar</p>
                {payableItems.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-400">No hay ítems pendientes por pagar</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  {payableItems.map((item) => {
                    const allocation = allocations.find((a) => a.itemId === item.id)
                    const paidItem = paidByItem.get(item.id) ?? 0
                    const pending = Math.max(0, getItemBudget(item, offerBudgetByKey) - paidItem)
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all ${
                          allocation?.selected
                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={allocation?.selected ?? false}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                        />
                        <span className="flex-1 min-w-[200px] text-sm text-slate-700 truncate">
                          {item.nombre || item.descripcion || item.id}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">
                          Pend: {formatCurrencyCO(pending)}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={allocation?.amount ?? ''}
                          disabled={!allocation?.selected}
                          onChange={(e) => setItemAmount(item.id, e.target.value)}
                          placeholder="0.00"
                          className={`w-40 px-3 py-1.5 text-sm border rounded-lg disabled:bg-slate-50 disabled:text-slate-300 focus:outline-none focus:ring-2 transition-colors ${
                            allocation?.selected && Number(allocation.amount) > pending + 0.009
                              ? 'border-red-300 focus:ring-red-300/30 focus:border-red-400 text-red-600'
                              : 'border-slate-300 focus:ring-primary/30 focus:border-primary'
                          }`}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Total a pagar:</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrencyCO(selectedTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {porcientoSplit.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Distribución ({porcientoSplit.length} ítem{porcientoSplit.length !== 1 ? 's' : ''})
                      </p>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {porcientoSplit.map((row) => (
                        <li key={row.itemId} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50/50 transition-colors">
                          <span className="text-slate-700 truncate flex-1 font-medium">{itemLabel(row.itemId)}</span>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatCurrencyCO(row.pending)} pend.</span>
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                            {porcientoValue}%
                          </span>
                          <span className="font-bold text-slate-900 whitespace-nowrap min-w-[100px] text-right">{formatCurrencyCO(row.amount)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total a pagar</span>
                      <span className="text-base font-bold text-slate-900">{formatCurrencyCO(amountValue)}</span>
                    </div>
                  </div>
                ) : porcientoValue && Number(porcientoValue) > 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-400">No hay ítems para distribuir con este porciento</p>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting ? (uploading ? 'Cargando soporte...' : 'Registrando...') : 'Registrar pago'}
              </button>
            </div>
          </form>
        </Modal>

        {activeTab === 'pagos' && (
          payments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto">
              <Banknote className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 mt-3">No hay pagos registrados</p>
            <p className="text-xs text-slate-400 mt-1">Los pagos que registres aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modalidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítems</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Soporte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.status === 'Anulado' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {p.method ? METHOD_LABEL[p.method] : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate">
                      {(p.paymentItems?.length ?? 0) > 0
                        ? `${p.paymentItems!.length} ítem${p.paymentItems!.length !== 1 ? 's' : ''}`
                        : p.method === 'prorrateo' ? 'Todos los ítems' : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                      {p.description || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{formatCurrencyCO(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(p.attachments?.length ?? 0) > 0 ? (
                        <button
                          onClick={() => handleDownloadSupport(p.attachments![0])}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                          title={p.attachments![0].originalName}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                          <FileText className="w-3.5 h-3.5" /> Sin soporte
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{p.createdBy?.fullName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}
      </div>

      {showNoOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-amber-100 rounded-xl mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Oferta económica requerida</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                El evento debe contar con oferta económica aprobada antes de registrar pagos
              </p>
              <button
                onClick={() => setShowNoOfferModal(false)}
                className="mt-5 px-4 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

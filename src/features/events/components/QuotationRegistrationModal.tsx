import { useState, useEffect, useMemo, useRef } from 'react'
import {
  X, FileUp, Save, Loader2, Receipt, FileText, Download, CheckCircle2, AlertCircle, FileCheck2,
} from 'lucide-react'
import type { Event, TaxCategory, Attachment, ItemInput } from '../../../types'
import { TAX_CATEGORIES } from '../../../config/constants'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { calculateEventSummary } from '../../../utils/calculationEngine'
import { getTariffPriceApi } from '../../../services/tariffs.service'
import { createQuotationApi, updateQuotationApi } from '../../../services/quotations.service'
import {
  getEventAttachmentsApi,
  uploadAttachmentApi,
  deleteAttachmentApi,
  downloadAttachment,
} from '../../../services/attachments.service'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'
import type { Offer, OfferItem, OfferInput, OfferItemInput } from '../../offers/types'
import { CLIENTE_OFERTA_DEFAULT } from '../../offers/types'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'

const taxCategoryLabels: Record<TaxCategory, string> = {
  IVA: 'IVA',
  Consumo: 'Consumo',
  Tercero: 'Tercero',
  Reembolso: 'Reembolso',
}

function quotationItemKey(item: { descripcion: string; cantidad: number; tariffId?: string }): string {
  return item.tariffId ? `t:${item.tariffId}|${item.cantidad}` : `d:${item.descripcion}|${item.cantidad}`
}

const MAX_SOPORTE_MB = 10
const MAX_SOPORTE_BYTES = MAX_SOPORTE_MB * 1024 * 1024

function soporteFileError(file: File): string | null {
  const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'El documento soporte debe ser un archivo PDF'
  if (file.size > MAX_SOPORTE_BYTES) {
    return `El documento PDF no puede superar los ${MAX_SOPORTE_MB} MB`
  }
  return null
}

interface QuotationItemForm {
  eventItemId: string
  nombre: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  isTariffed: boolean
  selected: boolean
  tariffId?: string
  aliadoId?: string
}

interface QuotationRegistrationModalProps {
  event: Event
  quotationsCount: number
  editingOffer?: Offer | null
  onClose: () => void
  onSaved?: (notice?: string) => void
}

export function QuotationRegistrationModal({
  event,
  quotationsCount,
  editingOffer,
  onClose,
  onSaved,
}: QuotationRegistrationModalProps) {
  const params = useActiveCalculationParams()
  const isEditing = Boolean(editingOffer)

  const [items, setItems] = useState<QuotationItemForm[]>(() => {
    if (!editingOffer) {
      return event.items.map((it) => ({
        eventItemId: it.id,
        nombre: it.nombre ?? '',
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        valorUnitario: 0,
        categoriaTributaria: it.categoriaTributaria || 'IVA',
        isTariffed: it.isTariffed === true,
        selected: true,
        tariffId: it.tariffId,
        aliadoId: it.aliadoId,
      }))
    }
    const quotationItemsByKey = new Map<string, OfferItem>()
    for (const qi of editingOffer.items) {
      const key = quotationItemKey(qi)
      if (!quotationItemsByKey.has(key)) quotationItemsByKey.set(key, qi)
    }
    return event.items.map((it) => {
      const key = it.tariffId
        ? `t:${it.tariffId}|${it.cantidad}`
        : `d:${it.nombre || it.descripcion}|${it.cantidad}`
      const quoteItem = quotationItemsByKey.get(key)
      return {
        eventItemId: it.id,
        nombre: it.nombre ?? '',
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        valorUnitario: quoteItem?.valorUnitario ?? 0,
        categoriaTributaria: quoteItem?.categoriaTributaria ?? it.categoriaTributaria,
        isTariffed: it.isTariffed === true,
        selected: Boolean(quoteItem),
        tariffId: it.tariffId,
        aliadoId: it.aliadoId,
      }
    })
  })
  const [tariffPrices, setTariffPrices] = useState<Record<string, number>>({})
  const [tariffPricesLoaded, setTariffPricesLoaded] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editingOffer) return
    let active = true
    getEventAttachmentsApi(event.id)
      .then((list) => {
        if (active) {
          setExistingAttachments(
            list.filter(
              (a) => a.category === 'Cotizaciones presentadas' && a.quotationId === editingOffer.id,
            ),
          )
        }
      })
      .catch(() => {
        if (active) setExistingAttachments([])
      })
    return () => {
      active = false
    }
  }, [event.id, editingOffer])

  useEffect(() => {
    const tariffIds = Array.from(
      new Set(items.filter((it) => it.isTariffed && it.tariffId).map((it) => it.tariffId as string)),
    )
    if (tariffIds.length === 0) return
    let active = true
    Promise.all(
      tariffIds.map(async (tariffId) => {
        const price = await getTariffPriceApi(tariffId, event.municipalityCategory)
        return [tariffId, price] as const
      }),
    )
      .then((prices) => {
        if (active) setTariffPrices(Object.fromEntries(prices))
      })
      .catch(() => {
        if (active) setTariffPrices({})
      })
      .finally(() => {
        if (active) setTariffPricesLoaded(true)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseEventCode = event.numeroEvento + (event.sufijo ? `-${event.sufijo}` : '')
  const previewCode = useMemo(
    () => (editingOffer ? editingOffer.codigo : `COT-${baseEventCode}-${quotationsCount + 1}`),
    [baseEventCode, quotationsCount, editingOffer],
  )
  const today = new Date()
  const selectedCount = items.filter((it) => it.selected).length
  const allSelected = items.length > 0 && items.every((it) => it.selected)

  function effectiveUnitValue(it: QuotationItemForm): number {
    if (it.isTariffed) {
      return it.tariffId ? tariffPrices[it.tariffId] ?? 0 : 0
    }
    return it.valorUnitario || 0
  }

  function rowError(it: QuotationItemForm): string | null {
    if (!it.selected) return null
    if (it.isTariffed && !it.tariffId) return 'Seleccione un servicio del tarifario'
    if (!it.isTariffed && (!it.valorUnitario || it.valorUnitario <= 0)) return 'Ingrese el valor unitario negociado'
    return null
  }

  const selectedItems = useMemo(() => items.filter((it) => it.selected), [items])

  const summary = useMemo(() => {
    const inputs: ItemInput[] = selectedItems.map((it) => ({
      descripcion: it.nombre || it.descripcion,
      cantidad: it.cantidad,
      valorUnitario: it.isTariffed
        ? it.tariffId
          ? tariffPrices[it.tariffId] ?? 0
          : 0
        : it.valorUnitario || 0,
      categoriaTributaria: it.categoriaTributaria,
      isTariffed: it.isTariffed,
      ...(it.tariffId ? { tariffId: it.tariffId } : {}),
    }))
    return calculateEventSummary(inputs, params)
  }, [selectedItems, tariffPrices, params])

  const pendingTariffValues = selectedItems.some(
    (it) => it.isTariffed && it.tariffId && tariffPrices[it.tariffId] === undefined,
  )

  function toggleAllItems(selected: boolean) {
    setItems((prev) => prev.map((it) => ({ ...it, selected })))
    setError(null)
  }

  function updateItem(eventItemId: string, updates: Partial<QuotationItemForm>) {
    setItems((prev) => prev.map((it) => (it.eventItemId === eventItemId ? { ...it, ...updates } : it)))
    setError(null)
  }

  function validate(): string | null {
    if (items.length === 0) {
      return 'La orden no tiene ítems registrados para cotizar'
    }
    if (selectedItems.length === 0) return 'Seleccione al menos un ítem para la cotización'
    for (const it of selectedItems) {
      const label = it.nombre || it.descripcion
      const err = rowError(it)
      if (err) {
        if (it.isTariffed) {
          return `El ítem "${label}" requiere seleccionar un servicio del tarifario`
        }
        return `Ingrese el valor unitario negociado del ítem "${label}"`
      }
    }
    if (!isEditing && !file) {
      return 'El documento soporte del proveedor es obligatorio'
    }
    if (file) {
      return soporteFileError(file)
    }
    return null
  }

  function buildDto(): OfferInput {
    const quoteItems: OfferItemInput[] = items.filter((it) => it.selected).map((it) => {
      const isExempt = it.categoriaTributaria === 'Tercero' || it.categoriaTributaria === 'Reembolso'
      const dtoItem: OfferItemInput = {
        itemId: it.eventItemId,
        descripcion: it.nombre || it.descripcion,
        cantidad: it.cantidad,
        valorUnitario: it.isTariffed ? 0 : it.valorUnitario,
        categoriaTributaria: it.categoriaTributaria,
        isTariffed: it.isTariffed,
        ...(it.isTariffed
          ? { tariffId: it.tariffId }
          : {}),
        ...(it.aliadoId ? { aliadoId: it.aliadoId } : {}),
        ivaRate: it.categoriaTributaria === 'IVA' ? params.ivaRate : isExempt ? 0 : undefined,
        consumptionTaxRate:
          it.categoriaTributaria === 'Consumo' ? params.impuestoConsumoRate : isExempt ? 0 : undefined,
      }
      return dtoItem
    })

    return {
      codigo: previewCode,
      nombre: `Cotización ${previewCode}`,
      descripcion: `Cotización del evento ${baseEventCode}`,
      cliente: CLIENTE_OFERTA_DEFAULT,
      eventoId: event.id,
      quotationDate: today.toISOString().slice(0, 10),
      items: quoteItems,
    }
  }

  async function handleSave() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const quotation = editingOffer
        ? await updateQuotationApi(editingOffer.id, { items: buildDto().items })
        : await createQuotationApi(buildDto())

      let notice: string | undefined
      if (file) {
        try {
          const uploaded = await uploadAttachmentApi(event.id, 'Cotizaciones presentadas', file, quotation.id)
          if (editingOffer && existingAttachments.length > 0) {
            for (const att of existingAttachments) {
              if (att.id !== uploaded.id) {
                try {
                  await deleteAttachmentApi(att.id)
                } catch {
                  notice = isEditing
                    ? 'La cotización se editó, pero el documento soporte anterior no pudo eliminarse.'
                    : undefined
                }
              }
            }
          }
        } catch {
          notice = isEditing
            ? 'La cotización se editó, pero no se pudo adjuntar el nuevo documento soporte.'
            : 'La cotización se guardó, pero no se pudo subir el documento soporte.'
        }
      }
      onSaved?.(notice)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cotización'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[92vh] overflow-y-auto animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-primary/10 rounded-md">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">
                  {isEditing ? 'Edición de cotización' : 'Registro de cotización'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditing
                    ? `Ajuste de la valoración económica de la orden ${baseEventCode}`
                    : `Valoración económica de los requerimientos de la orden ${baseEventCode}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y divide-slate-200 border-t border-slate-200 sm:divide-y-0 sm:divide-x">
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">N.º cotización</p>
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">{previewCode}</p>
            </div>
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Fecha de registro</p>
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">{formatDateCO(today)}</p>
            </div>
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Ítems a valorar</p>
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                {selectedCount} <span className="text-slate-400">de {items.length}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-7">
          <section>
            <header className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                  aria-hidden="true"
                >
                  1
                </span>
                <h4 className="text-sm font-semibold text-slate-800">Selección y valoración de ítems</h4>
              </div>
              {items.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${selectedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {selectedCount} de {items.length} aplican
                </span>
              )}
            </header>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md px-6 py-12 text-center">
                <p className="text-sm text-slate-400">
                  La orden no tiene ítems registrados. Agregue ítems en la carpeta de requerimientos antes de cotizar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm min-w-[920px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-16">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none" title="Marcar o desmarcar todos los ítems">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            disabled={items.length === 0}
                            onChange={(e) => toggleAllItems(e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/50"
                          />
                          <span>Aplica</span>
                        </label>
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-10">N.º</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500">Servicio</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-20">Cant.</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-44">Vr. unitario</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-40">Carga tributaria</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-40">Vr. total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it, idx) => {
                      const resolvedPrice = it.isTariffed && it.tariffId ? tariffPrices[it.tariffId] : undefined
                      const priceLoading = it.isTariffed && it.tariffId && resolvedPrice === undefined && !tariffPricesLoaded
                      const effectiveUnit = effectiveUnitValue(it)
                      const lineTotal = effectiveUnit * it.cantidad
                      const err = rowError(it)
                      return (
                        <tr
                          key={it.eventItemId}
                          className={`align-top transition-colors ${
                            err ? 'bg-red-50/40' : it.selected ? 'hover:bg-slate-50/60' : 'opacity-50'
                          }`}
                        >
                          <td className="px-3 py-3.5">
                            <input
                              type="checkbox"
                              checked={it.selected}
                              onChange={(e) => updateItem(it.eventItemId, { selected: e.target.checked })}
                              className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/50"
                            />
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-3.5">
                            <p className={`font-medium text-slate-900 ${it.selected ? '' : 'text-slate-500'}`}>
                              {it.nombre || it.descripcion}
                            </p>
                            {it.descripcion && it.descripcion !== it.nombre && (
                              <p className="text-xs text-slate-500 mt-0.5">{it.descripcion}</p>
                            )}
                            <span
                              className={`mt-1.5 inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                                it.isTariffed ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {it.isTariffed ? 'Tarifado' : 'No tarifado'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{it.cantidad}</td>
                          <td className="px-3 py-3.5">
                            {it.isTariffed ? (
                              <div className="text-right">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    value={resolvedPrice ?? ''}
                                    readOnly
                                    disabled
                                    placeholder="Según tarifario"
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-sm font-mono text-right bg-slate-50 text-slate-600 placeholder:text-slate-400 pr-8"
                                  />
                                  {priceLoading && (
                                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                                  )}
                                </div>
                                {resolvedPrice !== undefined && (
                                  <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                    Cat. {event.municipalityCategory || 'del municipio'}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={it.valorUnitario || ''}
                                  onChange={(e) => updateItem(it.eventItemId, { valorUnitario: Number(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className={`w-full px-2.5 py-1.5 border rounded-md text-sm font-mono text-right focus:ring-2 focus:ring-primary/50 focus:border-transparent ${
                                    err ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                  }`}
                                />
                                {err && (
                                  <p className="text-[10px] text-red-600 mt-1 inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Ingrese el valor unitario
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <select
                              value={it.categoriaTributaria}
                              onChange={(e) => updateItem(it.eventItemId, { categoriaTributaria: e.target.value as TaxCategory })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                            >
                              {TAX_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{taxCategoryLabels[cat]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            {!it.selected ? (
                              <span className="text-[11px] text-slate-300">—</span>
                            ) : effectiveUnit > 0 ? (
                              <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                                {formatCurrencyCO(lineTotal)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              {isEditing ? (
                <>
                  Marque en la columna «Aplica» los ítems que harán parte de esta cotización. Los que ya estaban
                  incluidos vienen marcados; al guardar, solo los marcados quedan en la cotización. El valor unitario de
                  los servicios tarifados se recalcula según la categoría DIVIPOLA del municipio.
                </>
              ) : (
                <>
                  Marque en la columna «Aplica» los ítems que harán parte de esta cotización (mínimo uno). Los ítems se
                  heredan de la orden (carpeta de requerimientos) y el valor unitario de los servicios tarifados se calcula
                  según la categoría DIVIPOLA del municipio al guardar.
                </>
              )}
            </p>
          </section>

          <section>
            <header className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                  aria-hidden="true"
                >
                  2
                </span>
                <h4 className="text-sm font-semibold text-slate-800">Resumen de la cotización</h4>
              </div>
              {pendingTariffValues && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Cargando valores del tarifario...
                </span>
              )}
            </header>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="divide-x divide-slate-200">
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Base</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.baseTotal)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">IVA</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.ivaTotal)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Imp. consumo</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.impuestoConsumoTotal)}
                      </p>
                    </td>
                  </tr>
                  <tr className="divide-x divide-slate-200 border-t border-slate-200">
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">FEE</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.feeTarifadoTotal + summary.eventTotals.feeTercerosTotal)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">IVA FEE</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.ivaFeeTotal)}
                      </p>
                    </td>
                    <td className="px-4 py-3 bg-primary/5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-primary">Total estimado</p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-primary tabular-nums">
                        {formatCurrencyCO(summary.eventTotals.granTotal)}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {pendingTariffValues
                ? 'El total se recalcula en vivo a medida que carga el tarifario para los servicios tarifados.'
                : selectedCount === 0
                  ? 'Marque al menos un ítem en la columna «Aplica» para ver el resumen de la cotización.'
                  : 'Resumen calculado con los valores actuales. El total definitivo se consolida al guardar la cotización.'}
            </p>
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                aria-hidden="true"
              >
                3
              </span>
              <h4 className="text-sm font-semibold text-slate-800">
                Documento soporte del proveedor {!isEditing && <span className="text-red-500">*</span>}
              </h4>
            </header>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null
                setFile(selected)
                setError(selected ? soporteFileError(selected) : null)
                e.target.value = ''
              }}
            />
            {isEditing && existingAttachments.length > 0 && !file && (
              <div className="mb-3 border border-slate-200 rounded-md divide-y divide-slate-200 overflow-hidden">
                {existingAttachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{att.originalName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(att.fileSize / 1024).toFixed(1)} KB · {formatDateCO(att.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        downloadAttachment(att.id, att.originalName)
                        addAuditEntry({
                          accion: 'Descarga de adjunto',
                          entidad: 'Attachment',
                          entidadId: att.id,
                          usuario: getCurrentUser(),
                          fecha: new Date().toISOString(),
                          detalle: `Documento soporte "${att.originalName}" descargado al editar la cotización ${editingOffer?.codigo ?? ''}`,
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-white border border-slate-200 rounded-md hover:bg-primary/5 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className={`flex items-center gap-3 border rounded-md px-4 py-3 transition-colors cursor-pointer ${
                file
                  ? 'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400'
                  : 'border-dashed border-slate-300 hover:border-slate-400'
              }`}
              onClick={() => docInputRef.current?.click()}
            >
              <span className={`p-2 rounded-md shrink-0 ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {file ? <FileCheck2 className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-sm truncate">
                  {file ? (
                    <>
                      <span className="font-medium text-slate-900">{file.name}</span>
                      <span className="text-slate-400 font-mono"> ({(file.size / 1024).toFixed(1)} KB)</span>
                    </>
                  ) : (
                    <span className="text-slate-400">
                      {isEditing && existingAttachments.length > 0
                        ? 'Seleccione un nuevo PDF para reemplazar el documento actual...'
                        : isEditing
                          ? 'Seleccione un PDF soporte (opcional)...'
                          : 'Seleccione el PDF de la cotización enviada por el proveedor externo (obligatorio)...'}
                    </span>
                  )}
                </span>
                {file && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    Listo para adjuntar
                  </span>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-xs font-medium text-red-600 hover:text-red-700 shrink-0"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {isEditing
                ? existingAttachments.length > 0
                  ? 'Si adjunta un nuevo PDF (máximo 10 MB), reemplazará el documento soporte actual de la cotización.'
                  : 'Opcional: si adjunta un PDF (máximo 10 MB), se guarda en la carpeta de soportes «Cotizaciones presentadas» del evento.'
                : 'El PDF (máximo 10 MB) se guarda en la carpeta de soportes «Cotizaciones presentadas» del evento.'}
            </p>
          </section>

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 rounded-r-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200 sm:items-center">
            {selectedCount > 0 && (
              <p className="text-xs text-slate-500 sm:mr-auto">
                Total estimado:{' '}
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatCurrencyCO(summary.eventTotals.granTotal)}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar cotización'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

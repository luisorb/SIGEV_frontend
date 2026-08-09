import { useState, useEffect, useMemo, useRef } from 'react'
import { X, FileUp, Save, Loader2, Receipt } from 'lucide-react'
import type { Event, TaxCategory } from '../../../types'
import { TAX_CATEGORIES } from '../../../config/constants'
import { formatDateCO } from '../../../utils/formatters'
import { getTariffPriceApi } from '../../../services/tariffs.service'
import { createQuotationApi } from '../../../services/quotations.service'
import { uploadAttachmentApi } from '../../../services/attachments.service'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'
import type { OfferInput, OfferItemInput } from '../../offers/types'
import { getApiErrorMessage } from '../../../lib/apiErrors'

const taxCategoryLabels: Record<TaxCategory, string> = {
  IVA: 'IVA',
  Consumo: 'Consumo',
  Tercero: 'Tercero',
  Reembolso: 'Reembolso',
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
  onClose: () => void
  onSaved?: (notice?: string) => void
}

export function QuotationRegistrationModal({
  event,
  quotationsCount,
  onClose,
  onSaved,
}: QuotationRegistrationModalProps) {
  const params = useActiveCalculationParams()

  const [items, setItems] = useState<QuotationItemForm[]>(() =>
    event.items.map((it) => ({
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
    })),
  )
  const [tariffPrices, setTariffPrices] = useState<Record<string, number>>({})
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const tariffIds = Array.from(
      new Set(items.filter((it) => it.isTariffed && it.tariffId).map((it) => it.tariffId as string)),
    )
    Promise.all(
      tariffIds.map(async (tariffId) => {
        const price = await getTariffPriceApi(tariffId, event.municipalityCategory)
        return [tariffId, price] as const
      }),
    )
      .then((prices) => setTariffPrices(Object.fromEntries(prices)))
      .catch(() => setTariffPrices({}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseEventCode = event.numeroEvento + (event.sufijo ? `-${event.sufijo}` : '')
  const previewCode = useMemo(
    () => `COT-${baseEventCode}-${quotationsCount + 1}`,
    [baseEventCode, quotationsCount],
  )
  const today = new Date()
  const selectedCount = items.filter((it) => it.selected).length

  function updateItem(eventItemId: string, updates: Partial<QuotationItemForm>) {
    setItems((prev) => prev.map((it) => (it.eventItemId === eventItemId ? { ...it, ...updates } : it)))
    setError(null)
  }

  function validate(): string | null {
    if (items.length === 0) return 'La orden no tiene ítems registrados para cotizar'
    const selectedItems = items.filter((it) => it.selected)
    if (selectedItems.length === 0) return 'Seleccione al menos un ítem para la cotización'
    for (const it of selectedItems) {
      const label = it.nombre || it.descripcion
      if (it.isTariffed && !it.tariffId) {
        return `El ítem "${label}" requiere seleccionar un servicio del tarifario`
      }
      if (!it.isTariffed && (!it.valorUnitario || it.valorUnitario <= 0)) {
        return `Ingrese el valor unitario negociado del ítem "${label}"`
      }
    }
    if (!file) {
      return 'El documento soporte del proveedor es obligatorio'
    }
    return soporteFileError(file)
  }

  function buildDto(): OfferInput {
    const quoteItems: OfferItemInput[] = items.filter((it) => it.selected).map((it) => {
      const isExempt = it.categoriaTributaria === 'Tercero' || it.categoriaTributaria === 'Reembolso'
      const dtoItem: OfferItemInput = {
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
      cliente: '',
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
      const quotation = await createQuotationApi(buildDto())

      let notice: string | undefined
      if (file) {
        try {
          await uploadAttachmentApi(event.id, 'Cotizaciones presentadas', file, quotation.id)
        } catch {
          notice = 'La cotización se guardó, pero no se pudo subir el documento soporte.'
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
                <h3 className="text-base font-semibold tracking-tight text-slate-900">Registro de cotización</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valoración económica de los requerimientos de la orden {baseEventCode}
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
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">{selectedCount}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-7">
          <section>
            <header className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3.5 bg-primary rounded-sm" aria-hidden="true" />
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Ítems de la orden · valoración económica
              </h4>
            </header>

            {items.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md px-6 py-12 text-center">
                <p className="text-sm text-slate-400">
                  La orden no tiene ítems registrados. Agregue ítems en la carpeta de requerimientos antes de cotizar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-14">Aplica</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-10">N.º</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500">Servicio</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-20">Cant.</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-36">Clasificación</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-36">Vr. unitario</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-36">Carga tributaria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it, idx) => {
                      const resolvedPrice = it.isTariffed && it.tariffId ? tariffPrices[it.tariffId] : undefined
                      return (
                        <tr key={it.eventItemId} className={`align-top ${it.selected ? 'hover:bg-slate-50/60' : 'opacity-50'}`}>
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
                            <p className="font-medium text-slate-900">{it.nombre || it.descripcion}</p>
                            {it.descripcion && it.descripcion !== it.nombre && (
                              <p className="text-xs text-slate-500 mt-0.5">{it.descripcion}</p>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{it.cantidad}</td>
                          <td className="px-3 py-3.5">
                            {it.isTariffed ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                                Tarifado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                                No tarifado
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            {it.isTariffed ? (
                              <div className="text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={resolvedPrice ?? ''}
                                  readOnly
                                  disabled
                                  placeholder="Según tarifario"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-sm font-mono text-right bg-slate-50 text-slate-600 placeholder:text-slate-400"
                                />
                                {resolvedPrice !== undefined && (
                                  <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                    Cat. {event.municipalityCategory || 'del municipio'}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={it.valorUnitario || ''}
                                onChange={(e) => updateItem(it.eventItemId, { valorUnitario: Number(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm font-mono text-right focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                              />
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              Marque en la columna «Aplica» los ítems que harán parte de esta cotización (mínimo uno). Los ítems se
              heredan de la orden (carpeta de requerimientos) y el valor unitario de los servicios tarifados se calcula
              según la categoría DIVIPOLA del municipio al guardar.
            </p>
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3.5 bg-primary rounded-sm" aria-hidden="true" />
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Documento soporte del proveedor <span className="text-red-500">*</span>
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
            <div
              className="flex items-center gap-3 border border-dashed border-slate-300 rounded-md px-4 py-3 hover:border-slate-400 transition-colors cursor-pointer"
              onClick={() => docInputRef.current?.click()}
            >
              <FileUp className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block text-sm truncate">
                  {file ? (
                    <>
                      <span className="font-mono text-slate-900">{file.name}</span>
                      <span className="text-slate-400 font-mono"> ({(file.size / 1024).toFixed(1)} KB)</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Seleccione el PDF de la cotización enviada por el proveedor externo (obligatorio)...</span>
                  )}
                </span>
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
              El PDF (máximo {MAX_SOPORTE_MB} MB) se guarda en la carpeta de soportes «Cotizaciones presentadas» del evento.
            </p>
          </section>

          {error && (
            <div className="p-3 border-l-2 border-red-600 bg-red-50 rounded-r-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200">
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
              {saving ? 'Guardando...' : 'Guardar cotización'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type MatrixView = 'detallada' | 'global'

export interface DetailedRow {
  eventoId: string
  numeroEvento: string
  fechaEvento: string
  municipio: string
  estado: string
  itemId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: string
  base: number
  iva: number
  impuestoConsumo: number
  feeTarifado: number
  feeTerceros: number
  ivaFee: number
  total: number
  aliadoId: string
  aliadoNombre: string
  desembolsoId: string
  desembolsoNombre: string
}

export interface MatrixCell {
  desembolsoId: string
  desembolsoNombre: string
  aliadoId: string
  aliadoNombre: string
  cantidadEventos: number
  valorTotal: number
  feeTotal: number
}

export interface MatrixRow {
  desembolsoId: string
  desembolsoNombre: string
  cells: Record<string, MatrixCell>
  totalEventos: number
  totalValor: number
  totalFee: number
}

export interface MatrixTotals {
  totalEventos: number
  totalValor: number
  totalFee: number
  totalBase: number
  totalIva: number
  totalConsumo: number
  totalFeeTarifado: number
  totalFeeTerceros: number
  totalIvaFee: number
}

export interface MatrixSummary {
  totalEventos: number
  totalItems: number
  totalBase: number
  totalImpuestos: number
  totalFee: number
  totalIvaFee: number
  totalGeneral: number
}

export interface MatrixFilters {
  periodoDesde: string
  periodoHasta: string
  municipioId: string
  estado: string
  desembolsoId: string
  aliadoId: string
}

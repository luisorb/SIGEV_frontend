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
}

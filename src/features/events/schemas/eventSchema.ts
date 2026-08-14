import { z } from 'zod'
import { EVENT_STATES, EVENT_SCHEMAS } from '../../../config/constants'

export const eventSchema = z.object({
  numeroEvento: z
    .string()
    .min(1, 'El número de evento es obligatorio'),
  sufijo: z
    .string()
    .default(''),
  responsable: z
    .string()
    .min(1, 'El responsable es obligatorio'),
  dependencia: z
    .string()
    .default(''),
  fechaEvento: z
    .string()
    .min(1, 'La fecha del evento es obligatoria'),
  asistentes: z
    .number()
    .min(0, 'Los asistentes no pueden ser negativos')
    .default(0),
  dias: z
    .number()
    .min(0, 'Los días no pueden ser negativos')
    .default(0),
  municipioId: z
    .string()
    .min(1, 'El municipio es obligatorio'),
  vereda: z
    .string()
    .default(''),
  latitud: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined
      const num = typeof value === 'number' ? value : Number(value)
      return Number.isNaN(num) ? undefined : num
    },
    z.number().optional(),
  ),
  longitud: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined
      const num = typeof value === 'number' ? value : Number(value)
      return Number.isNaN(num) ? undefined : num
    },
    z.number().optional(),
  ),
  observaciones: z
    .string()
    .default(''),
  aliadoId: z
    .string()
    .default(''),
  desembolsoId: z
    .string()
    .min(1, 'El recurso disponible es obligatorio'),
  esquema: z
    .enum(EVENT_SCHEMAS, {
      errorMap: () => ({ message: 'Seleccione un esquema válido' }),
    }),
  estado: z
    .enum(EVENT_STATES)
    .default('Abierto'),
})

export type EventFormValues = z.infer<typeof eventSchema>

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
  municipioId: z
    .string()
    .min(1, 'El municipio es obligatorio'),
  aliadoId: z
    .string()
    .min(1, 'El aliado es obligatorio'),
  desembolsoId: z
    .string()
    .min(1, 'El desembolso es obligatorio'),
  esquema: z
    .enum(EVENT_SCHEMAS, {
      errorMap: () => ({ message: 'Seleccione un esquema válido' }),
    }),
  estado: z
    .enum(EVENT_STATES)
    .default('Abierto'),
})

export type EventFormValues = z.infer<typeof eventSchema>

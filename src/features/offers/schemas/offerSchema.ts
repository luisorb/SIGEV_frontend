import { z } from 'zod'

export const offerSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string(),
  cliente: z.string().min(1, 'El cliente es obligatorio'),
  eventoId: z.string().min(1, 'El evento asociado es obligatorio'),
  numeroEvento: z.string().optional(),
  responsable: z.string().optional(),
  dependencia: z.string().optional(),
  municipio: z.string().optional(),
  aliado: z.string().optional(),
  desembolso: z.string().optional(),
  esquema: z.string().optional(),
})

export type OfferFormValues = z.infer<typeof offerSchema>

import { z } from 'zod'
import { TAX_CATEGORIES } from '../../../config/constants'

export const itemSchema = z.object({
  descripcion: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  cantidad: z
    .number()
    .positive('La cantidad debe ser mayor a 0'),
  valorUnitario: z
    .number()
    .min(0, 'El valor unitario no puede ser negativo'),
  categoriaTributaria: z
    .enum(TAX_CATEGORIES, {
      errorMap: () => ({ message: 'Seleccione una categoría tributaria válida' }),
    }),
  aliadoId: z
    .string()
    .optional(),
})

export const itemFormSchema = itemSchema.extend({
  eventoId: z.string().min(1),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>
export type ItemSchemaValues = z.infer<typeof itemSchema>

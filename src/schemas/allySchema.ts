import { z } from 'zod'

export const allyFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre (razón social) es obligatorio')
    .max(50, 'El nombre no puede superar los 50 caracteres'),
  tipoIdentificacion: z
    .string()
    .trim()
    .min(1, 'Seleccione el tipo de identificación'),
  numeroIdentificacion: z
    .string()
    .trim()
    .min(1, 'El número de identificación es obligatorio')
    .max(20, 'El número de identificación no puede superar los 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'El número de identificación solo puede contener letras y números'),
  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(15, 'El teléfono no puede superar los 15 caracteres')
    .regex(/^\d+$/, 'El teléfono solo debe contener números'),
  correo: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .max(50, 'El correo electrónico no puede superar los 50 caracteres')
    .email('Ingrese un correo electrónico válido'),
  divipolaCode: z
    .string()
    .trim()
    .min(1, 'Seleccione el departamento DIVIPOLA'),
  divipolaDepartment: z.string(),
  contacto: z
    .string()
    .trim()
    .min(1, 'El contacto (nombres y apellidos) es obligatorio')
    .max(50, 'El contacto no puede superar los 50 caracteres'),
  color: z.string(),
  activo: z.boolean(),
})

export type AllyFormValues = z.infer<typeof allyFormSchema>

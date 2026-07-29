import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { offerSchema, type OfferFormValues } from '../schemas/offerSchema'
import type { Offer } from '../types'

interface UseOfferFormOptions {
  offer?: Offer
  initialData?: Partial<{
    eventoId: string
    numeroEvento: string
    responsable: string
    dependencia: string
    municipio: string
    aliado: string
    desembolso: string
    esquema: string
  }>
  onSave: (data: OfferFormValues) => void
}

export function useOfferForm({ offer, initialData, onSave }: UseOfferFormOptions) {
  const base = offer
    ? {
        codigo: offer.codigo,
        nombre: offer.nombre,
        descripcion: offer.descripcion,
        cliente: offer.cliente,
        eventoId: offer.eventoId ?? '',
        numeroEvento: offer.numeroEvento ?? '',
        responsable: offer.responsable ?? '',
        dependencia: offer.dependencia ?? '',
        municipio: offer.municipio ?? '',
        aliado: offer.aliado ?? '',
        desembolso: offer.desembolso ?? '',
        esquema: offer.esquema ?? '',
      }
    : {
        codigo: '',
        nombre: '',
        descripcion: '',
        cliente: '',
        eventoId: initialData?.eventoId ?? '',
        numeroEvento: initialData?.numeroEvento ?? '',
        responsable: initialData?.responsable ?? '',
        dependencia: initialData?.dependencia ?? '',
        municipio: initialData?.municipio ?? '',
        aliado: initialData?.aliado ?? '',
        desembolso: initialData?.desembolso ?? '',
        esquema: initialData?.esquema ?? '',
      }

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema, undefined, { raw: true }),
    defaultValues: base,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const submit = handleSubmit((data: OfferFormValues) => {
    onSave(data)
  })

  return { register, handleSubmit: submit, errors, isSubmitting, form }
}

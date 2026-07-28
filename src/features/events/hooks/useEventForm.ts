import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '../schemas/eventSchema'
import type { z } from 'zod'
import type { Event } from '../../../types'

type EventFormValues = z.infer<typeof eventSchema>

interface UseEventFormOptions {
  event?: Event
  onSave: (data: EventFormValues) => void
}

export function useEventForm({ event, onSave }: UseEventFormOptions) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as never,
    defaultValues: event
      ? {
          numeroEvento: event.numeroEvento,
          sufijo: event.sufijo,
          responsable: event.responsable,
          municipioId: event.municipioId,
          aliadoId: event.aliadoId,
          desembolsoId: event.desembolsoId,
          esquema: event.esquema,
          estado: event.estado,
        }
      : {
          numeroEvento: '',
          sufijo: '',
          responsable: '',
          municipioId: '',
          aliadoId: '',
          desembolsoId: '',
          esquema: 'cotizacion',
          estado: 'Abierto',
        },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form

  const watchedValues = watch()

  const submit = handleSubmit((data: EventFormValues) => {
    onSave(data)
  })

  return {
    register,
    handleSubmit: submit,
    errors,
    isSubmitting,
    watchedValues,
    setValue,
    form,
  }
}

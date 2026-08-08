import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '../schemas/eventSchema'
import type { z } from 'zod'
import type { Event } from '../../../types'
import { getCurrentUser } from '../../../config/constants'

type EventFormValues = z.infer<typeof eventSchema>

interface UseEventFormOptions {
  event?: Event
  onSave: (data: EventFormValues, file?: File | null) => void
}

export function useEventForm({ event, onSave }: UseEventFormOptions) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as never,
    defaultValues: event
      ? {
          numeroEvento: event.numeroEvento,
          sufijo: event.sufijo,
          responsable: event.responsable,
          dependencia: event.dependencia,
          fechaEvento: event.fechaEvento,
          asistentes: event.asistentes,
          dias: event.dias,
          municipioId: event.municipioId,
          vereda: event.vereda,
          latitud: event.latitud,
          longitud: event.longitud,
          observaciones: event.observaciones,
          aliadoId: event.aliadoId,
          desembolsoId: event.desembolsoId,
          esquema: event.esquema,
          estado: event.estado,
        }
      : {
          numeroEvento: '',
          sufijo: '',
          responsable: getCurrentUser(),
          dependencia: '',
          fechaEvento: '',
          asistentes: 0,
          dias: 0,
          municipioId: '',
          vereda: '',
          latitud: '' as unknown as EventFormValues['latitud'],
          longitud: '' as unknown as EventFormValues['longitud'],
          observaciones: '',
          aliadoId: '',
          desembolsoId: '',
          esquema: '' as EventFormValues['esquema'],
          estado: 'Abierto',
        },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = form

  const watchedValues = useWatch({ control })

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

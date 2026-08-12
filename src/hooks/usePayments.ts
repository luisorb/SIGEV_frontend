import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPaymentsApi,
  getPaymentsSummaryApi,
  createPaymentApi,
  updatePaymentApi,
  deletePaymentApi,
} from '../services/payments.service'
import type { CreatePaymentDto, UpdatePaymentDto } from '../services/types'

const PAYMENTS_KEY = ['payments']
const SUMMARY_KEY = ['payments', 'summary']

export function usePayments(eventId?: string) {
  return useQuery({
    queryKey: ['payments', eventId ?? 'all'],
    queryFn: () => getPaymentsApi(eventId),
    enabled: eventId ? !!eventId : true,
  })
}

export function usePaymentsSummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: getPaymentsSummaryApi,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentDto) => createPaymentApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY })
      qc.invalidateQueries({ queryKey: SUMMARY_KEY })
    },
  })
}

export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentDto }) => updatePaymentApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY })
      qc.invalidateQueries({ queryKey: SUMMARY_KEY })
    },
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePaymentApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENTS_KEY })
      qc.invalidateQueries({ queryKey: SUMMARY_KEY })
    },
  })
}

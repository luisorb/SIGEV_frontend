import { LOCAL_CONFIG } from '../config/constants'

const currencyFormatter = new Intl.NumberFormat(LOCAL_CONFIG.locale, {
  style: 'currency',
  currency: LOCAL_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat(LOCAL_CONFIG.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrencyCO(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatNumberCO(amount: number): string {
  return numberFormatter.format(amount)
}

export function formatDateCO(date: string | Date): string {
  const dateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  if (dateOnly) {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(LOCAL_CONFIG.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(LOCAL_CONFIG.locale, {
    timeZone: LOCAL_CONFIG.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTimeCO(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(LOCAL_CONFIG.locale, {
    timeZone: LOCAL_CONFIG.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

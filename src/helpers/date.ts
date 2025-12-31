export const pad2 = (n: number) => String(n).padStart(2, '0')

export const formatDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${y}-${m}-${day}`
}

export const formatDateTime = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

export const toISO = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString()
}

export const rangeToISO = (range: any): { start?: string; end?: string } => {
  if (!range || !Array.isArray(range) || range.length < 2) return {}
  return {
    start: toISO(range[0]),
    end: toISO(range[1]),
  }
}

export const rangeToDayBounds = (range: any): { start?: string; end?: string } => {
  if (!range || !Array.isArray(range) || range.length < 2) return {}
  const s = formatDate(range[0])
  const e = formatDate(range[1])
  return {
    start: s ? `${s} 00:00:00` : undefined,
    end: e ? `${e} 23:59:59` : undefined,
  }
}

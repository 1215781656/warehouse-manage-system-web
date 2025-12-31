export const clipToDate = (start?: string, end?: string): { start?: string; end?: string } => {
  const s = start ? String(start).substring(0, 10) : undefined
  const e = end ? String(end).substring(0, 10) : undefined
  return { start: s, end: e }
}

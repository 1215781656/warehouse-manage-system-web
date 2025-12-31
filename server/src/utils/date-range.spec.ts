import { clipToDate } from './date-range'

describe('clipToDate', () => {
  it('clips start/end to YYYY-MM-DD', () => {
    const r = clipToDate('2025-12-24 00:00:00', '2025-12-25 23:59:59')
    expect(r.start).toBe('2025-12-24')
    expect(r.end).toBe('2025-12-25')
  })

  it('handles missing start', () => {
    const r = clipToDate(undefined, '2025-12-25 23:59:59')
    expect(r.start).toBeUndefined()
    expect(r.end).toBe('2025-12-25')
  })

  it('handles missing end', () => {
    const r = clipToDate('2025-12-24 00:00:00', undefined)
    expect(r.start).toBe('2025-12-24')
    expect(r.end).toBeUndefined()
  })
})

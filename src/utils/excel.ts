export interface ExportColumn {
  label: string
  key: string
}

export interface ExportConfig {
  columns: ExportColumn[]
  fileName?: string
}

export const exportToXlsx = async (rows: any[], config: ExportConfig) => {
  let XLSX: any
  try {
    XLSX = await import('xlsx')
  } catch {
    XLSX = await import('xlsx/xlsx.mjs')
  }

  const data = rows.map(r => {
    const obj: Record<string, any> = {}
    for (const c of config.columns) {
      obj[c.label] = r[c.key]
    }
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const name = config.fileName || 'export.xlsx'
  XLSX.writeFile(wb, name)
}

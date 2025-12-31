import { DataSource } from 'typeorm'

export async function verifyDatabaseConnectionWithRetry(
  dataSource: DataSource,
  retries = 3,
  delayMs = 2000
) {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      await dataSource.query('SELECT 1')
      return
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

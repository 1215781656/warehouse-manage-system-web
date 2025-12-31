import { DataSource } from 'typeorm'

describe('DB connection failure', () => {
  it('fails when MySQL service is unavailable', async () => {
    const ds = new DataSource({
      type: 'mysql',
      host: '127.0.0.1',
      port: 65534,
      username: 'root',
      password: 'invalid',
      database: 'invalid',
      entities: [],
      connectTimeout: 1000,
      extra: { connectionLimit: 1, waitForConnections: true },
    })
    await expect(ds.initialize()).rejects.toBeDefined()
  })
})

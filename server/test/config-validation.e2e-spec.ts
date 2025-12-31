import { validateConfig } from '../src/config/validate'

describe('Config validation', () => {
  it('throws when DB_DISABLE=true', () => {
    expect(() =>
      validateConfig({
        DB_DISABLE: 'true',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USER: 'root',
        DB_PASS: 'password',
        DB_NAME: 'fabric_db',
      })
    ).toThrow()
  })

  it('throws when MySQL config missing', () => {
    expect(() =>
      validateConfig({
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USER: 'root',
        DB_PASS: '',
        DB_NAME: '',
      })
    ).toThrow()
  })
})

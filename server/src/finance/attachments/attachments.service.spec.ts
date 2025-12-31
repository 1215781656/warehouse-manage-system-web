import { AttachmentsService } from './attachments.service'

const makeRepo = () => {
  const data: any[] = []
  return {
    save: jest.fn(async (x) => {
      const item = { id: String(Math.random()), uploadedAt: new Date(), ...x }
      data.push(item)
      return item
    }),
    find: jest.fn(async (q?: any) => {
      if (q?.where?.refId) return data.filter((d) => d.refId === q.where.refId)
      return data
    }),
    findOne: jest.fn(async (q?: any) => {
      if (q?.where?.path) return data.find((d) => d.path === q.where.path) || null
      if (q?.where?.id) return data.find((d) => d.id === q.where.id) || null
      return null
    }),
    delete: jest.fn(async (id: string) => {
      const idx = data.findIndex((d) => d.id === id)
      if (idx >= 0) data.splice(idx, 1)
    })
  } as any
}

describe('AttachmentsService', () => {
  it('saves and lists tax files', async () => {
    const svc = new AttachmentsService(makeRepo() as any, makeRepo() as any)
    const list = await svc.saveTaxFiles('rid', [{ buffer: Buffer.from('a'), mimetype: 'image/jpeg', originalname: 'a.jpg' }])
    expect(list.length).toBe(1)
    expect(list[0].refId).toBe('rid')
  })

  it('saves and lists other files', async () => {
    const svc = new AttachmentsService(makeRepo() as any, makeRepo() as any)
    const list = await svc.saveOtherFiles('rid', [{ buffer: Buffer.from('a'), mimetype: 'application/pdf', originalname: 'a.pdf' }])
    expect(list.length).toBe(1)
    expect(list[0].refId).toBe('rid')
  })
})


import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ReceivableController } from './receivable.controller'
import { Receivable } from './receivable.entity'

describe('ReceivableController field mapping and formatting', () => {
  let controller: ReceivableController
  const repo: any = {
    create: jest.fn((v: any) => v),
    save: jest.fn(async (v: any) => ({ ...v, id: 'r1' })),
    update: jest.fn(async () => ({})),
    findOne: jest.fn(async () => ({ id: 'r1', outboundOrder: {} })),
    createQueryBuilder: jest.fn(() => {
      const qb: any = {
        leftJoinAndSelect: jest.fn(() => qb),
        where: jest.fn(() => qb),
        andWhere: jest.fn(() => qb),
        getCount: jest.fn(async () => 1),
        orderBy: jest.fn(() => qb),
        skip: jest.fn(() => qb),
        take: jest.fn(() => qb),
        getMany: jest.fn(async () => [
          {
            id: 'r1',
            outboundOrder: undefined,
            outboundDate: '2025-12-25',
            outboundNo: '77',
            deliveryNo: 'D-77',
            customer: 'C-77',
            productSpec: 'PS-77',
            receivableAmount: '770.01',
            receivedAmount: '770.01',
            unpaidAmount: '0.00',
            taxInvoiceAmount: '770',
            source: 'manual',
            deletedAt: null,
            remark: 'ok',
          },
        ]),
        select: jest.fn(() => qb),
        leftJoin: jest.fn(() => qb),
        getRawOne: jest.fn(async () => ({
          totalReceivable: 770.01,
          totalReceived: 770.01,
          totalUnpaid: 0.0,
          taxInvoiceTotal: 770.0,
        })),
      }
      return qb
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      controllers: [ReceivableController],
      providers: [{ provide: getRepositoryToken(Receivable), useValue: repo }],
    }).compile()
    controller = moduleRef.get(ReceivableController)
  })

  it('create should accept and normalize outbound payload and amounts', async () => {
    const dto = {
      outboundDate: '2025-12-25T01:40:37.418Z',
      outboundNo: '77',
      deliveryNo: 'D-77',
      customer: 'C-77',
      productSpec: 'PS-77',
      receivedAmount: 770.01,
      taxInvoiceAmount: 770,
      receivableAmount: 770.01,
      remark: 'ok',
    } as any
    const saved = await controller.create(dto)
    expect(repo.create).toHaveBeenCalled()
    expect(saved.outboundDate).toBe('2025-12-25')
    expect(saved.outboundNo).toBe('77')
    expect(saved.deliveryNo).toBe('D-77')
    expect(saved.productSpec).toBe('PS-77')
    expect(saved.customer).toBe('C-77')
    expect(saved.receivedAmount).toBe('770.01')
    expect(saved.taxInvoiceAmount).toBe('770')
    expect(saved.unpaidAmount).toBe('0.00')
    expect(saved.remark).toBe('ok')
  })

  it('update should recalculate unpaidAmount and map fields', async () => {
    const res = await controller.update('r1', {
      outboundDate: '2025-12-25T01:40:37.418Z',
      outboundNo: '77',
      deliveryNo: 'D-77',
      productSpec: 'PS-77',
      customer: 'C-77x',
      receivedAmount: 770.01,
      receivableAmount: 770.01,
      taxInvoiceAmount: 770,
      remark: 'updated',
    } as any)
    expect(repo.update).toHaveBeenCalled()
    const patchArg = (repo.update as jest.Mock).mock.calls[0][1]
    expect(patchArg.outboundDate).toBe('2025-12-25')
    expect(patchArg.outboundNo).toBe('77')
    expect(patchArg.deliveryNo).toBe('D-77')
    expect(patchArg.productSpec).toBe('PS-77')
    expect(patchArg.unpaidAmount).toBe('0.00')
    expect(patchArg.remark).toBe('updated')
    expect(res).toBeDefined()
  })
  it('update received only should use existing receivableAmount to compute unpaid', async () => {
    repo.findOne.mockResolvedValue({ id: 'r1', receivableAmount: '500.00', receivedAmount: '400.00' })
    await controller.update('r1', { receivedAmount: 500.0 } as any)
    const patchArg = (repo.update as jest.Mock).mock.calls[(repo.update as jest.Mock).mock.calls.length - 1][1]
    expect(patchArg.unpaidAmount).toBe('0.00')
  })

  it('list should include all fields with proper formatting', async () => {
    const out = await controller.list('1', '10')
    expect(out.list[0].outboundDate).toBe('2025-12-25')
    expect(out.list[0].outboundNo).toBe('77')
    expect(out.list[0].deliveryNo).toBe('D-77')
    expect(out.list[0].productSpec).toBe('PS-77')
    expect(out.list[0].customer).toBe('C-77')
    expect(out.list[0].receivedAmount).toBe(770.01)
    expect(out.list[0].taxInvoiceAmount).toBe(770)
    expect(out.list[0].remark).toBe('ok')
  })
})

import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { PayableController } from './payable.controller'
import { Payable } from './payable.entity'

describe('PayableController field mapping and formatting', () => {
  let controller: PayableController
  const repo: any = {
    create: jest.fn((v: any) => v),
    save: jest.fn(async (v: any) => ({ ...v, id: 'p1' })),
    update: jest.fn(async () => ({})),
    findOne: jest.fn(async () => ({ id: 'p1', inboundOrder: {} })),
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
            id: 'p1',
            inboundOrder: undefined,
            inboundDate: '2025-12-25',
            inboundNo: '66',
            supplier: '66',
            productSpec: '66',
            payableAmount: '660.01',
            paidAmount: '660.01',
            unpaidAmount: '0.00',
            taxInvoiceAmount: '660',
            source: 'manual',
            deletedAt: null,
            remark: '66',
          },
        ]),
        select: jest.fn(() => qb),
        leftJoin: jest.fn(() => qb),
        getRawOne: jest.fn(async () => ({
          totalPayable: 660.01,
          totalPaid: 660.01,
          totalUnpaid: 0.0,
          taxInvoiceTotal: 660.0,
        })),
      }
      return qb
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      controllers: [PayableController],
      providers: [{ provide: getRepositoryToken(Payable), useValue: repo }],
    }).compile()
    controller = moduleRef.get(PayableController)
  })

  it('create should accept and normalize inbound payload and amounts', async () => {
    const dto = {
      inboundDate: '2025-12-25T01:40:37.418Z',
      inboundNo: '66',
      supplier: '66',
      productSpec: '66',
      paidAmount: 660.01,
      taxInvoiceAmount: 660,
      payableAmount: 660.01,
      remark: '66',
    } as any
    const saved = await controller.create(dto)
    expect(repo.create).toHaveBeenCalled()
    expect(saved.inboundDate).toBe('2025-12-25')
    expect(saved.inboundNo).toBe('66')
    expect(saved.productSpec).toBe('66')
    expect(saved.supplier).toBe('66')
    expect(saved.paidAmount).toBe('660.01')
    expect(saved.taxInvoiceAmount).toBe('660')
    expect(saved.unpaidAmount).toBe('0.00')
    expect(saved.remark).toBe('66')
  })

  it('update should recalculate unpaidAmount and map fields', async () => {
    const res = await controller.update('p1', {
      inboundDate: '2025-12-25T01:40:37.418Z',
      inboundNo: '66',
      productSpec: '66',
      supplier: '66x',
      paidAmount: 660.01,
      payableAmount: 660.01,
      taxInvoiceAmount: 660,
      remark: 'updated',
    } as any)
    expect(repo.update).toHaveBeenCalled()
    const patchArg = (repo.update as jest.Mock).mock.calls[0][1]
    expect(patchArg.inboundDate).toBe('2025-12-25')
    expect(patchArg.inboundNo).toBe('66')
    expect(patchArg.productSpec).toBe('66')
    expect(patchArg.unpaidAmount).toBe('0.00')
    expect(patchArg.remark).toBe('updated')
    expect(res).toBeDefined()
  })
  it('update paid only should use existing payableAmount to compute unpaid', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1', payableAmount: '500.00', paidAmount: '400.00' })
    await controller.update('p1', { paidAmount: 500.0 } as any)
    const patchArg = (repo.update as jest.Mock).mock.calls[(repo.update as jest.Mock).mock.calls.length - 1][1]
    expect(patchArg.unpaidAmount).toBe('0.00')
  })

  it('list should include all fields with proper formatting', async () => {
    const out = await controller.list('1', '10')
    expect(out.list[0].inboundDate).toBe('2025-12-25')
    expect(out.list[0].inboundNo).toBe('66')
    expect(out.list[0].productSpec).toBe('66')
    expect(out.list[0].supplier).toBe('66')
    expect(out.list[0].paidAmount).toBe(660.01)
    expect(out.list[0].taxInvoiceAmount).toBe(660)
    expect(out.list[0].remark).toBe('66')
  })
})

import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ExportService } from './export.service'
import { InboundOrder } from '../inventory/inbound/inbound.entity'
import { OutboundOrder } from '../inventory/outbound/outbound.entity'
import { Inventory } from '../inventory/stock/inventory.entity'
import { ColorFabric } from '../inventory/fabric/color-fabric.entity'
import { BadRequestException } from '@nestjs/common'

describe('ExportService', () => {
  let service: ExportService
  const inRepo = { find: jest.fn() } as any as Repository<InboundOrder>
  const outRepo = { find: jest.fn() } as any as Repository<OutboundOrder>
  const invRepo = { find: jest.fn() } as any as Repository<Inventory>
  const cfRepo = { find: jest.fn() } as any as Repository<ColorFabric>

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: getRepositoryToken(InboundOrder), useValue: inRepo },
        { provide: getRepositoryToken(OutboundOrder), useValue: outRepo },
        { provide: getRepositoryToken(Inventory), useValue: invRepo },
        { provide: getRepositoryToken(ColorFabric), useValue: cfRepo },
      ],
    }).compile()
    service = moduleRef.get(ExportService)
    jest.resetAllMocks()
  })

  it('validates payload ids and columns', () => {
    expect(() =>
      service['validatePayload']({
        entity: 'outbound',
        ids: [],
        columns: [],
      } as any),
    ).toThrow(BadRequestException)
    expect(() =>
      service['validatePayload']({
        entity: 'outbound',
        ids: ['a', ''],
        columns: [{ key: 'id', header: 'ID' }],
      } as any),
    ).toThrow(BadRequestException)
  })

  it('pickValue supports nested keys', () => {
    const row = { a: { b: { c: 1 } } }
    expect(service['pickValue'](row, 'a.b.c')).toBe(1)
    expect(service['pickValue'](row, 'a.b.d')).toBeNull()
  })

  it('normalizeValue handles types', () => {
    expect(service['normalizeValue']('1', 'number')).toBe(1)
    const d = new Date('2020-01-01')
    expect(service['normalizeValue']('2020-01-01', 'date')).toBeInstanceOf(Date)
    expect(service['normalizeValue'](d, 'date')).toBe(d)
    expect(service['normalizeValue'](null, 'text')).toBe('')
  })

  it('fetchRows delegates to repositories', async () => {
    outRepo.find = jest.fn().mockResolvedValue([{ id: 'x' }])
    const rows = await service['fetchRows']('outbound', ['x'])
    expect(rows.length).toBe(1)
    expect(outRepo.find).toHaveBeenCalled()
  })
})


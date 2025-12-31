import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { InboundController } from './inbound.controller'
import { InboundOrder } from './inbound.entity'
import { Inventory } from '../stock/inventory.entity'
import { ColorFabric } from '../fabric/color-fabric.entity'
import { OperationLog } from '../../system/operation-log.entity'
import { InboundBatch } from './inbound-batch.entity'

describe('InboundController softDelete linkage', () => {
  let controller: InboundController
  const repo: any = {
    findOne: jest.fn(),
    update: jest.fn(),
    manager: {
      transaction: (fn: any) =>
        fn({
          getRepository: (entity: any) => {
            if (entity === InboundOrder) return repo
            if (entity === Inventory) return invRepo
            if (entity === ColorFabric) return fabricRepo
            if (entity === OperationLog) return logRepo
            throw new Error('unknown repo')
          },
        }),
    },
  }
  const invRepo: any = {
    findOne: jest.fn(),
    delete: jest.fn(),
  }
  const fabricRepo: any = {}
  const logRepo: any = {
    save: jest.fn(),
    create: jest.fn((v: any) => v),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      controllers: [InboundController],
      providers: [
        { provide: getRepositoryToken(InboundOrder), useValue: repo },
        { provide: getRepositoryToken(ColorFabric), useValue: fabricRepo },
        { provide: getRepositoryToken(Inventory), useValue: invRepo },
        { provide: getRepositoryToken(OperationLog), useValue: logRepo },
        { provide: getRepositoryToken(InboundBatch), useValue: {} },
      ],
    }).compile()
    controller = moduleRef.get(InboundController)
  })

  it('should delete inventory record linked by color_fabric_id when inbound is soft deleted', async () => {
    repo.findOne.mockResolvedValue({
      id: 'in1',
      inboundNo: 'IN-001',
      colorFabric: { id: 'cf1' },
      quantity: 5,
      weightKg: '12.50',
    })
    invRepo.findOne.mockResolvedValue({
      id: 'inv1',
      colorFabric: { id: 'cf1' },
      currentQuantity: 10,
    })
    invRepo.delete.mockResolvedValue({ affected: 1 })
    const res = await controller.softDelete('in1', { operator: 'tester' })
    expect(res).toEqual({ success: true })
    expect(repo.update).toHaveBeenCalled()
    expect(invRepo.findOne).toHaveBeenCalledWith({
      where: { colorFabric: { id: 'cf1' } },
      relations: ['colorFabric'],
    })
    expect(invRepo.delete).toHaveBeenCalledWith({ id: 'inv1' })
    expect(logRepo.save).toHaveBeenCalled()
  })
})

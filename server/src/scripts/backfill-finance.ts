import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DataSource } from 'typeorm'
import { OutboundOrder } from '../inventory/outbound/outbound.entity'
import { InboundOrder } from '../inventory/inbound/inbound.entity'
import { Receivable } from '../finance/receivable/receivable.entity'
import { Payable } from '../finance/payable/payable.entity'

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    const ds = app.get(DataSource)
    const outRepo = ds.getRepository(OutboundOrder)
    const inRepo = ds.getRepository(InboundOrder)
    const recRepo = ds.getRepository(Receivable)
    const payRepo = ds.getRepository(Payable)
    const outs = await outRepo.find({ relations: ['colorFabric'] })
    const ins = await inRepo.find({ relations: ['colorFabric'] })
    let createdRec = 0
    let createdPay = 0
    for (const o of outs) {
      const exists = await recRepo.findOne({ where: { outboundOrder: { id: (o as any).id } } as any })
      if (!exists) {
        const amount = Number((o as any).amount || 0)
        await recRepo.save(
          recRepo.create({
            outboundOrder: o as any,
            customer: String((o as any).customer || ''),
            receivableAmount: String(amount.toFixed(2)),
            receivedAmount: String(0),
            unpaidAmount: String(amount.toFixed(2)),
            taxInvoiceAmount: String(0),
            source: 'outbound',
            sourceId: String((o as any).id),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any),
        )
        createdRec++
      }
    }
    for (const i of ins) {
      const exists = await payRepo.findOne({ where: { inboundOrder: { id: (i as any).id } } as any })
      if (!exists) {
        const amount = Number((i as any).amount || 0)
        await payRepo.save(
          payRepo.create({
            inboundOrder: i as any,
            supplier: String((i as any).supplier || ''),
            payableAmount: String(amount.toFixed(2)),
            paidAmount: String(0),
            unpaidAmount: String(amount.toFixed(2)),
            taxInvoiceAmount: String(0),
            source: 'inbound',
            sourceId: String((i as any).id),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any),
        )
        createdPay++
      }
    }
    console.log(`[backfill-finance] receivable created: ${createdRec}, payable created: ${createdPay}`)
  } catch (e) {
    console.error('[backfill-finance] failed', e)
    process.exitCode = 1
  } finally {
    await app.close()
  }
}

main()

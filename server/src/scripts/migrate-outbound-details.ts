import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DataSource } from 'typeorm'
import { OutboundOrder } from '../inventory/outbound/outbound.entity'

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    const ds = app.get(DataSource)
    const repo = ds.getRepository(OutboundOrder)
    const rows = await repo.find()
    let migrated = 0
    for (const r of rows) {
      const hasOutbound = Array.isArray((r as any).outboundDetails) && (r as any).outboundDetails.length > 0
      const weightArrRaw = Array.isArray((r as any).weightDetails) ? (r as any).weightDetails : []
      const weightArr = weightArrRaw.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n) && n > 0)
      if (!hasOutbound && weightArr.length > 0) {
        const qty = weightArr.length
        const weight = weightArr.reduce((a: number, b: number) => a + b, 0)
        await repo.update({ id: (r as any).id }, {
          outboundDetails: weightArr,
          quantity: qty,
          weightKg: weight.toFixed(2) as any,
          weightDetails: null as any,
        } as any)
        migrated++
      }
    }
    console.log(`[migrate-outbound-details] migrated ${migrated} rows`)
  } catch (e) {
    console.error('[migrate-outbound-details] failed', e)
    process.exitCode = 1
  } finally {
    await app.close()
  }
}

main()

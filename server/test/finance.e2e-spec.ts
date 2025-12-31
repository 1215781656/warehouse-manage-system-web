import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Finance E2E', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('receivable list endpoint exists', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/receivable')
      .expect(200);
    expect(res.body).toBeDefined();
    expect(res.body.summary).toBeDefined();
    expect(res.body.globalSummary).toBeDefined();
  });
  it('payable list endpoint exists', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/payable')
      .expect(200);
    expect(res.body).toBeDefined();
    expect(res.body.summary).toBeDefined();
    expect(res.body.globalSummary).toBeDefined();
  });
  it('financial summary endpoint exists', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/financials/summary')
      .expect(200);
    expect(res.body).toBeDefined();
    expect(res.body.receivable).toBeDefined();
    expect(res.body.payable).toBeDefined();
  });
});

import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';

describe('App bootstrap constraints (e2e)', () => {
  it('fails when DB_DISABLE=true', async () => {
    process.env.DB_DISABLE = 'true';
    await expect(
      Test.createTestingModule({ imports: [AppModule] }).compile(),
    ).rejects.toBeDefined();
  });
});

import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';

describe('Startup error when MySQL config missing (e2e)', () => {
  it('fails when required env absent', async () => {
    delete process.env.DB_DISABLE;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASS;
    delete process.env.DB_NAME;
    await expect(
      Test.createTestingModule({ imports: [AppModule] }).compile(),
    ).rejects.toBeDefined();
  });
});

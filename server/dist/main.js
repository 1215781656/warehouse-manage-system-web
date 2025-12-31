"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const db_check_1 = require("./config/db-check");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: true,
    });
    app.enableCors({ origin: ['http://localhost:3000'], credentials: true });
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'server_uploads'), {
        prefix: '/files',
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('色布管理系统 API')
        .setDescription('REST 接口文档')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const ds = app.get(typeorm_1.DataSource);
    await (0, db_check_1.verifyDatabaseConnectionWithRetry)(ds, 3, 2000).catch((e) => {
        console.error('Database connection failed', e);
        process.exit(1);
    });
    await app.listen(3001);
}
bootstrap();
//# sourceMappingURL=main.js.map
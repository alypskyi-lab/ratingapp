import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const cfg = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Assessment API')
    .setDescription('Assessment backend')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup(process.env.SWAGGER_PATH || '/docs', app, doc);
}

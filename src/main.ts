import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import config from './common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Setup Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Stackron API')
    .setDescription('REST API for product and cart management')
    .setVersion('1.0')
    .addTag('products')
    .addTag('cart')
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port || 3000);
}
bootstrap()
  .then(() => {
    Logger.log(`
    ------------
    Server Application Started!
    API V1: ${config.baseUrl}
    API Docs: ${config.baseUrl}/docs
    Server Started Successfully
    ------------
`);
  })
  .catch((error) => {
    Logger.error(`Failed to start the application:= , ${error}`);
  });;

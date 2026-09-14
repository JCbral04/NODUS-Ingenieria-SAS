import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de la API: todas las rutas quedan bajo /api/*
  app.setGlobalPrefix('api');

  // Validación automática de DTOs (class-validator)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS para el frontend Next.js en desarrollo
  app.enableCors();

  // Swagger UI en /api/docs
  const config = new DocumentBuilder()
    .setTitle('NODUS API')
    .setDescription('Plataforma de orquestación de casos Mipyme ↔ Consultores — Ingenierías SAS')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`🚀 NODUS API en http://localhost:${port}/api/docs`);
}
bootstrap();

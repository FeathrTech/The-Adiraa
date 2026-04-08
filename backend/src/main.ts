import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.env.TZ = 'Asia/Kolkata';

  const app = await NestFactory.create(AppModule);

  // ✅ ENABLE CORS (CRITICAL FOR WEB)
  app.enableCors({
    origin: [
      'http://localhost:3000', // ← already have this, keep it
      'http://localhost:3001',
      'https://the-adiraa-1.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
}

bootstrap();
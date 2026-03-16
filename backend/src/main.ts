import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  // Force Node server timezone to IST
  process.env.TZ = 'Asia/Kolkata';

  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
}

bootstrap();
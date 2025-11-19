import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser(process.env.COOKIE_SECRET)); // for signed cookies
  // Morgan logging middleware

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }
  //app.use(morgan('dev')); // 'dev' prints concise colored logs
  // You can also use 'combined', 'tiny', or custom format
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes properties not in DTO
      forbidNonWhitelisted: true, // throws error when unknown values appear
      transform: true, // transforms payloads to DTO instances
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

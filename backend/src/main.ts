import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './configuracion';
import { verificarSecretoJwt } from './auth/secreto-jwt';

async function bootstrap() {
  verificarSecretoJwt();
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend escuchando en http://localhost:${port}/api`);
}
bootstrap();

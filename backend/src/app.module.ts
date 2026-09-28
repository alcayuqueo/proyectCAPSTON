import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CurriculumModule,
  ],
})
export class AppModule {}

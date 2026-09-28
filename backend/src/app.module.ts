import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { ResourcesModule } from './resources/resources.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CurriculumModule,
    ResourcesModule,
    ActivitiesModule,
  ],
})
export class AppModule {}

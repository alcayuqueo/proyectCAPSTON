import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LIMITES, LimiteSolicitudesGuard, MINUTO } from './common/limite-solicitudes.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { ResourcesModule } from './resources/resources.module';
import { ActivitiesModule } from './activities/activities.module';
import { PlannerModule } from './planner/planner.module';

@Module({
  imports: [
    // Límite de solicitudes por cliente; el login y el registro tienen límites propios más estrictos.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: MINUTO, limit: LIMITES.general }],
      errorMessage: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    }),
    PrismaModule,
    AuthModule,
    CurriculumModule,
    ResourcesModule,
    ActivitiesModule,
    PlannerModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: LimiteSolicitudesGuard }],
})
export class AppModule {}

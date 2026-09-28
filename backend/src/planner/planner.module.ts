import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [PlannerService, JwtStrategy],
  controllers: [PlannerController],
})
export class PlannerModule {}

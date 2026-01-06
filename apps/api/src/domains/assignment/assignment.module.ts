import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/database/prisma.module';
import { ShopModule } from '../shop/shop.module';
import { TemplateModule } from '../template/template.module';
import { AssignmentController } from './controllers/assignment.controller';
import { AssignmentService } from './services/assignment.service';
import { CollisionDetectorService } from './services/collision-detector.service';
import { AssignmentRepository } from './repositories/assignment.repository';
import { ASSIGNMENT_REPOSITORY } from './repositories/assignment.repository.interface';

/**
 * Assignment Module
 *
 * Felelősség: Template-ek hozzárendelése shop-okhoz
 *
 * Exports:
 * - AssignmentService - Más domain-ek is használhatják
 * - CollisionDetectorService - Collision detection más domain-eknek
 */
@Module({
  imports: [PrismaModule, ShopModule, TemplateModule],
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    CollisionDetectorService,
    {
      provide: ASSIGNMENT_REPOSITORY,
      useClass: AssignmentRepository,
    },
  ],
  exports: [AssignmentService, CollisionDetectorService],
})
export class AssignmentModule {}

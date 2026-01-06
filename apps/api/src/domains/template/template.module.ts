import { Module } from '@nestjs/common';
import { TemplateController } from './controllers/template.controller';
import { TemplateService } from './services/template.service';
import { FormulaValidatorService } from './services/formula-validator.service';
import { TemplateRepository } from './repositories/template.repository';
import { TEMPLATE_REPOSITORY } from './repositories/template.repository.interface';
import { PrismaModule } from '../common/database/prisma.module';
import { ShopModule } from '../shop/shop.module';

/**
 * Template Module
 *
 * Felelősség: Template domain koordináció
 *
 * Exports:
 * - TemplateService: Más modulok használhatják (pl. Calculation)
 *
 * Imports:
 * - PrismaModule: Adatbázis hozzáférés
 * - ShopModule: Shop repository access
 */
@Module({
  imports: [PrismaModule, ShopModule],
  controllers: [TemplateController],
  providers: [
    TemplateService,
    FormulaValidatorService,
    {
      provide: TEMPLATE_REPOSITORY,
      useClass: TemplateRepository,
    },
  ],
  exports: [TemplateService, FormulaValidatorService, TEMPLATE_REPOSITORY],
})
export class TemplateModule {}

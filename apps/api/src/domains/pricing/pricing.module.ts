import { Module } from '@nestjs/common';
import { PricingController } from './controllers/pricing.controller';
import { PriceCalculatorService } from './services/price-calculator.service';
import { FormulaEvaluatorService } from './services/formula-evaluator.service';
import { PrismaModule } from '../common/database/prisma.module';
import { TemplateModule } from '../template/template.module';
import { ShopModule } from '../shop/shop.module';

/**
 * Pricing Module
 *
 * Felelősség: Pricing domain koordináció
 *
 * Szolgáltatások:
 * - FormulaEvaluatorService: Biztonságos formula kiértékelés mathjs-sel
 * - PriceCalculatorService: Template keresés és ár kalkuláció
 *
 * API végpontok:
 * - GET /api/pricing/template/:productId - Template lekérése termékhez
 * - POST /api/pricing/calculate - Ár számítás
 *
 * Imports:
 * - PrismaModule: Adatbázis hozzáférés
 * - TemplateModule: Template repository és service
 * - ShopModule: Shop repository access
 *
 * Exports:
 * - FormulaEvaluatorService: Más modulok használhatják (pl. preview)
 * - PriceCalculatorService: Ár kalkulációhoz
 */
@Module({
  imports: [PrismaModule, TemplateModule, ShopModule],
  controllers: [PricingController],
  providers: [FormulaEvaluatorService, PriceCalculatorService],
  exports: [FormulaEvaluatorService, PriceCalculatorService],
})
export class PricingModule {}

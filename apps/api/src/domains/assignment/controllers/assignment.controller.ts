import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignmentService } from '../services/assignment.service';
import { CollisionDetectorService } from '../services/collision-detector.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AssignmentResponseDto, AssignmentListResponseDto } from '../dto/assignment-response.dto';
import { ShopId } from '../../common/interceptors/shop-header.interceptor';

/**
 * Assignment Controller
 *
 * Felelősség: Assignment REST API végpontok
 *
 * Végpontok:
 * - GET /api/assignments - Lista lekérése
 * - GET /api/assignments/:id - Egy assignment lekérése
 * - POST /api/assignments - Új assignment létrehozása
 * - PUT /api/assignments/:id - Assignment frissítése
 * - DELETE /api/assignments/:id - Assignment törlése
 * - PUT /api/assignments/:id/activate - Assignment aktiválása
 * - PUT /api/assignments/:id/deactivate - Assignment deaktiválása
 * - GET /api/assignments/collisions - Ütközések lekérése
 *
 * Multi-tenant security:
 * - ShopId from X-Shopify-Shop header (ShopHeaderGuard)
 * - Minden művelet shop-scoped
 */
@Controller('assignments')
export class AssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly collisionDetector: CollisionDetectorService,
  ) {}

  /**
   * GET /api/assignments
   *
   * Assignment lista lekérése pagination-nel
   */
  @Get()
  async listAssignments(
    @ShopId() shopId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ): Promise<AssignmentListResponseDto> {
    const result = await this.assignmentService.listAssignments(shopId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    const dtos = result.assignments.map((a) => AssignmentResponseDto.fromModel(a));

    return AssignmentListResponseDto.create(
      dtos,
      result.total,
      result.page,
      result.limit,
    );
  }

  /**
   * GET /api/assignments/:id
   *
   * Egy assignment lekérése ID alapján
   */
  @Get(':id')
  async getAssignment(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentService.getAssignment(id, shopId);
    return AssignmentResponseDto.fromModel(assignment);
  }

  /**
   * POST /api/assignments
   *
   * Új assignment létrehozása
   */
  @Post()
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @ShopId() shopId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentService.createAssignment(shopId, dto);
    return AssignmentResponseDto.fromModel(assignment);
  }

  /**
   * PUT /api/assignments/:id
   *
   * Assignment frissítése
   */
  @Put(':id')
  async updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @ShopId() shopId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentService.updateAssignment(id, shopId, dto);
    return AssignmentResponseDto.fromModel(assignment);
  }

  /**
   * DELETE /api/assignments/:id
   *
   * Assignment törlése
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssignment(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<void> {
    await this.assignmentService.deleteAssignment(id, shopId);
  }

  /**
   * PUT /api/assignments/:id/activate
   *
   * Assignment aktiválása
   */
  @Put(':id/activate')
  async activateAssignment(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentService.activateAssignment(id, shopId);
    return AssignmentResponseDto.fromModel(assignment);
  }

  /**
   * PUT /api/assignments/:id/deactivate
   *
   * Assignment deaktiválása
   */
  @Put(':id/deactivate')
  async deactivateAssignment(
    @Param('id') id: string,
    @ShopId() shopId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentService.deactivateAssignment(id, shopId);
    return AssignmentResponseDto.fromModel(assignment);
  }

  /**
   * GET /api/assignments/collisions
   *
   * Ütközések lekérése (több template ugyanarra a scope-ra)
   */
  @Get('collisions')
  async getCollisions(@ShopId() shopId: string) {
    return this.collisionDetector.detectCollisions(shopId);
  }
}

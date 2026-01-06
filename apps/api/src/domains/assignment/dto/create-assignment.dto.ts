import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Create Assignment DTO
 *
 * Input: Template hozzárendelése shop-hoz
 */
export class CreateAssignmentDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

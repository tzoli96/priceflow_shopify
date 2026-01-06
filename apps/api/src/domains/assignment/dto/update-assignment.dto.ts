import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

/**
 * Update Assignment DTO
 *
 * Input: Assignment frissítése (priority, isActive)
 */
export class UpdateAssignmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

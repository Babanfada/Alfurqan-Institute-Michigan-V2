import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import {
  programme_reg_category,
  programme_reg_discovery_method,
} from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProgrammeRegDto {
  @IsString()
  @IsNotEmpty()
  programme: string;

  @IsEnum(programme_reg_category)
  category: programme_reg_category;

  @IsEnum(programme_reg_discovery_method)
  discovery_method: programme_reg_discovery_method;
}
export class UpdateProgrammeRegDto extends PartialType(CreateProgrammeRegDto) {}
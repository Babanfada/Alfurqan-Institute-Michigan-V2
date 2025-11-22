import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsUrl,
  IsDateString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  year: number;

  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  image_public_id?: string;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

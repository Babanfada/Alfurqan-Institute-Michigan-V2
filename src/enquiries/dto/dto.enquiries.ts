import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { enquiries_status } from '@prisma/client';
export class CreateEnquiriesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @IsEnum(enquiries_status)
  @IsOptional()
  @IsString()
  status?: enquiries_status;
}
export class UpdateEnquiriesDto extends PartialType(CreateEnquiriesDto) {}
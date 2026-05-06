import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PlayerProgressDto {
  @IsInt()
  @Min(0)
  position: number;

  @IsOptional()
  @IsInt()
  currentScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dartsThrown?: number;
}

export class UpdateGameDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerProgressDto)
  players?: PlayerProgressDto[];
}

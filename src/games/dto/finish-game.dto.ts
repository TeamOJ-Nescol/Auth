import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PlayerStatDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  position: number;

  @IsOptional()
  @IsInt()
  finalScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dartsThrown?: number;
}

export class FinishGameDto {
  @IsOptional()
  @IsString()
  winner?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatDto)
  players: PlayerStatDto[];
}

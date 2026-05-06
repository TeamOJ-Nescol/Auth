import { ArrayMinSize, IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsIn(['501', '301', 'cricket'])
  mode: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  players: string[];
}

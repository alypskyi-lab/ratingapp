import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class SubmitPlayerDto {
  @ApiProperty()
  @IsString()
  playerId!: string;

  @ApiPropertyOptional()
  @IsNumber()
  score!: number;
}

class SubmitTeamDto {
  @ApiProperty({ type: [SubmitPlayerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitPlayerDto)
  players!: SubmitPlayerDto[];
}

export class MatchSubmitRequest {
  @ApiProperty({ type: [SubmitTeamDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitTeamDto)
  teams!: SubmitTeamDto[];
}
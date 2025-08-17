import { ApiProperty } from '@nestjs/swagger';

export class GetPlayerRatingResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mu!: number;

  @ApiProperty()
  sigma!: number;
}

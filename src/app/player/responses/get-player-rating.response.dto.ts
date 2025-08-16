import { ApiProperty } from '@nestjs/swagger';

export class GetPlayerRatingResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    mu!: number;

    @ApiProperty()
    sigma!: number;

    @ApiProperty()
    exposure!: number;
}
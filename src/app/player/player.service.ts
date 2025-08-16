import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Rating} from '@entities/rating.entity';
import {GetPlayerRatingResponseDto} from "./responses/get-player-rating.response.dto";

@Injectable()
export class PlayersService {
    constructor(@InjectRepository(Rating) private ratings: Repository<Rating>) {}

    async getPlayerRating(id: string): Promise<GetPlayerRatingResponseDto> {
        return this.ratings.findOneOrFail({
            select: ['id', 'mu', 'sigma', 'exposure'],
            where: { player: { id } },
        });
    }
}
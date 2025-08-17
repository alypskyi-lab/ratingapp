import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Rating} from '@app/processors/rating/rating.entity';
import {GetPlayerRatingResponse} from "./responses/get-player-rating.response";
import {Player} from "@app/api/player/player.entity";

@Injectable()
export class PlayersService {
    constructor(
        @InjectRepository(Rating) private rating: Repository<Rating>,
        @InjectRepository(Player) private player: Repository<Player>
    ) {}

    async getPlayers(): Promise<Player[]> {
        return this.player.find();
    }

    async getPlayerRating(id: string): Promise<GetPlayerRatingResponse> {
        return this.rating.findOneOrFail({
            select: ['id', 'mu', 'sigma'],
            where: { player: { id } },
        });
    }
}
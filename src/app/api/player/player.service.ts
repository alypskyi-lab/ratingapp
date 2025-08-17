import { Player } from '@app/api/player/player.entity';
import { Rating } from '@app/api/rating/rating.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetPlayerRatingResponse } from './responses/get-player-rating.response';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Rating) private rating: Repository<Rating>,
    @InjectRepository(Player) private player: Repository<Player>,
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

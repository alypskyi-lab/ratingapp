import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Rating } from './rating.entity';

@Injectable()
export class RatingService {
  constructor(@InjectRepository(Rating) private rating: Repository<Rating>) {}

  async getLeaderboard(limit = 100): Promise<string[]> {
    const rows = await this.rating
      .createQueryBuilder('rating')
      .innerJoin('rating.player', 'player')
      .select('player.username', 'username')
      .orderBy('rating.mu - 3 * rating.sigma', 'DESC')
      .take(limit)
      .getRawMany<{ username: string }>();

    return rows.map((result) => result.username);
  }
}

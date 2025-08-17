import { MatchParticipant } from '@app/api/match/match-participant.entity';
import { MatchSubmitRequest } from '@app/api/match/requests/match-submit.request';
import { RecomputeRatingEvent } from '@app/processors/rating/events/recompute-rating.event';
import { QueueService } from '@common/services/queue/queue.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Match } from './match.entity';

@Injectable()
export class MatchService {
  constructor(
    private readonly ds: DataSource,
    private readonly queue: QueueService,
  ) {}

  async submit(request: MatchSubmitRequest): Promise<string> {
    return this.ds.transaction(async (trx) => {
      const { teams } = request;

      const match = trx.create(Match);
      await trx.save(match);

      const matchParticipants = teams.flatMap(({ players }, team) => {
        return players.map(({ playerId, score }) =>
          trx.create(MatchParticipant, {
            matchId: match.id,
            playerId,
            score,
            team,
          }),
        );
      });
      await trx.save(matchParticipants);

      await this.queue.add(new RecomputeRatingEvent(match.id));

      return match.id;
    });
  }
}

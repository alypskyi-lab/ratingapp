import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Match } from './match.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RATING_QUEUE } from '@common/constants';
import {MatchSubmitRequest} from "@app/api/match/requests/match-submit.request";
import {MatchParticipant} from "@app/api/match/match-participant.entity";

@Injectable()
export class MatchService {
  constructor(
      private readonly ds: DataSource,
      @InjectQueue(RATING_QUEUE) private readonly queue: Queue,
  ) {}

  async submit(request: MatchSubmitRequest): Promise<string> {
    return this.ds.transaction(async (trx) => {
      const { teams } = request;

      const match = trx.create(Match);
      await trx.save(match);

      const matchParticipants = teams.flatMap(({ players }, team) => {
        return players.map(({ playerId, score }) => trx.create(MatchParticipant, {
          matchId: match.id,
          playerId,
          score,
          team
        }));
      })
      await trx.save(matchParticipants);

      await this.queue.add(
          'recompute',
          { matchId: match.id },
          { removeOnComplete: true, attempts: 3 },
      );

      return match.id;
    });
  }
}
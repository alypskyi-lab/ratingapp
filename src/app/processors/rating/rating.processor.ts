import { Match } from '@app/api/match/match.entity';
import { MatchParticipant } from '@app/api/match/match-participant.entity';
import { Rating } from '@app/api/rating/rating.entity';
import { DEFAULT_MU, DEFAULT_SIGMA, RATING_QUEUE } from '@common/constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { rate, Team } from 'openskill';
import { In, Repository } from 'typeorm';

@Processor(RATING_QUEUE)
export class RatingsProcessor extends WorkerHost {
  private readonly logger = new Logger(RatingsProcessor.name);

  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(MatchParticipant) private readonly participants: Repository<MatchParticipant>,
    @InjectRepository(Rating) private readonly ratings: Repository<Rating>,
  ) {
    super();
  }

  async process(job: Job<{ matchId: string }>) {
    const { matchId } = job.data;

    this.logger.verbose(`Start computing participant ratings for match ${matchId}`);

    const match = await this.matches.findOne({ where: { id: matchId } });
    if (!match) {
      this.logger.warn(`Match ${matchId} not found; skipping...`);
      return false;
    }

    const matchParticipants = await this.participants.find({
      where: { matchId },
      order: { team: 'ASC', createdAt: 'ASC' },
    });
    if (!matchParticipants.length) {
      this.logger.warn(`No participants for match ${matchId}; skipping...`);
      return false;
    }

    const teamCount = Math.max(...matchParticipants.map((r) => r.team)) + 1;
    const byTeam: string[][] = Array.from({ length: teamCount }, () => []);
    for (const participant of matchParticipants) byTeam[participant.team].push(participant.playerId);

    this.logger.debug('Computing such teams with players: ', byTeam);
    this.logger.verbose(`Collected ${byTeam.flat().length} participant(s) for ${matchId}`);

    const participantRatings = await this.getParticipantRatings(byTeam);
    const participantRanks = await this.getParticipantRanks(matchParticipants, teamCount);
    const newRatings = rate(participantRatings, { rank: participantRanks });

    this.logger.debug('Computed ratings for teams: ', newRatings);

    const updates: Array<{ player: { id: string }; mu: number; sigma: number }> = [];
    for (let team = 0; team < byTeam.length; team++) {
      for (let participant = 0; participant < byTeam[team].length; participant++) {
        const id = byTeam[team][participant];
        const newRating = newRatings[team][participant];
        updates.push({
          player: { id },
          mu: newRating.mu,
          sigma: newRating.sigma,
        });
      }
    }

    await this.ratings.upsert(updates, {
      conflictPaths: ['player'],
      skipUpdateIfNoValuesChanged: true,
    });

    return true;
  }

  private async getParticipantRatings(byTeam: string[][]): Promise<Team[]> {
    const teams: { mu: number; sigma: number }[][] = [];

    const allPlayerIds = byTeam.flat();
    const uniquePlayerIds = Array.from(new Set(allPlayerIds));

    const existingRatings = await this.ratings.find({
      where: { player: { id: In(uniquePlayerIds) } },
      relations: ['player'],
    });

    const ratingByPlayerId = new Map<string, Rating>();
    for (const rating of existingRatings) {
      ratingByPlayerId.set(rating.player.id, rating);
    }

    for (let team = 0; team < byTeam.length; team++) {
      const teamPlayerIds = byTeam[team];
      const teamRatings = teamPlayerIds.map((pid) => {
        const existing = ratingByPlayerId.get(pid);
        return {
          mu: existing?.mu ?? DEFAULT_MU,
          sigma: existing?.sigma ?? DEFAULT_SIGMA,
        };
      });
      teams.push(teamRatings);
    }

    this.logger.verbose(`Collected ${ratingByPlayerId.size} existing ratings for ${uniquePlayerIds.length} players`);
    this.logger.debug('Collected ratings for teams:', teams);

    return teams;
  }

  private async getParticipantRanks(matchParticipants: MatchParticipant[], teamCount: number): Promise<number[]> {
    const totals = new Array<number>(teamCount).fill(0);

    for (const participant of matchParticipants) {
      totals[participant.team] += participant.score ?? 0;
    }

    const uniqueTotalsDesc = [...new Set(totals)].sort((a, b) => b - a);
    const rankByTotal = new Map<number, number>();
    for (let i = 0; i < uniqueTotalsDesc.length; i++) {
      rankByTotal.set(uniqueTotalsDesc[i], i + 1);
    }

    this.logger.verbose(`Collected ${rankByTotal.size} unique totals for ${matchParticipants.length} participants`);
    this.logger.debug('Collected ranks for totals:', rankByTotal);

    return totals.map((total) => rankByTotal.get(total)!);
  }
}

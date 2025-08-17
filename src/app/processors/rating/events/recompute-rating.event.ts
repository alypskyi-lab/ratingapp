import { RATING_QUEUE } from '@common/constants';
import type { JobEvent } from '@common/services/queue/interfaces/job-event.interface';

export class RecomputeRatingEvent implements JobEvent<{ matchId: string }> {
  readonly queue = RATING_QUEUE;
  readonly name = 'recompute';

  constructor(public readonly matchId: string) {}

  toJSON() {
    return { matchId: this.matchId };
  }

  options = {
    removeOnComplete: true,
    attempts: 3,
  };
}

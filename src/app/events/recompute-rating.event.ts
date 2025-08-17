import {JobEvent} from "@common/services/queue/interfaces/job-event.interface";
import {RATING_QUEUE} from "@common/constants";

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
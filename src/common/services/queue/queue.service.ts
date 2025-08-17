import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {JobEvent} from "@common/services/queue/interfaces/job-event.interface";
import {RATING_QUEUE} from "@common/constants";

@Injectable()
export class QueueService {
    private readonly queues: Record<string, Queue>;

    constructor(
        @InjectQueue(RATING_QUEUE) private readonly ratingsQueue: Queue,
    ) {
        this.queues = {
            [RATING_QUEUE]: this.ratingsQueue,
        };
    }

    async add(event: JobEvent): Promise<void> {
        const queue = this.queues[event.queue];
        if (!queue) throw new Error(`Queue not registered: ${event.queue}`);

        await queue.add(event.name, event.toJSON(), event.options);
    }
}
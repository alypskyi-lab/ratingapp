import { RATING_QUEUE } from '@common/constants';
import { JobEvent } from '@common/services/queue/interfaces/job-event.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly queues: Record<string, Queue>;

  constructor(@InjectQueue(RATING_QUEUE) private readonly ratingsQueue: Queue) {
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

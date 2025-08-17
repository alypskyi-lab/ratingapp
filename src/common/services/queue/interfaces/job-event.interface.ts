import { JobsOptions } from 'bullmq';

export interface JobEvent<TPayload = any> {
    readonly queue: string;
    readonly name: string;
    toJSON(): TPayload;
    readonly options?: JobsOptions;
}
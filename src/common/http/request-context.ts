import { AsyncLocalStorage } from 'async_hooks';

export type ReqRes = { req?: any; res?: any };

const als = new AsyncLocalStorage<ReqRes>();

export class RequestContext {
    static run<T>(req: any, res: any, fn: () => T): T {
        return als.run({ req, res }, fn);
    }
}

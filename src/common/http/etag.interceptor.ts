import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { computeETag } from './etag.util';

@Injectable()
export class EtagInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req: any = ctx.getRequest();
        const res: any = ctx.getResponse();

        const ifNoneMatch = req.headers?.['if-none-match'] as string | undefined;

        return next.handle().pipe(
            map((data) => {
                const etag = computeETag(data);
                res.setHeader('ETag', etag);

                if (ifNoneMatch && ifNoneMatch === etag) {
                    res.status(304).end();
                    return undefined;
                }
                return data;
            }),
        );
    }
}
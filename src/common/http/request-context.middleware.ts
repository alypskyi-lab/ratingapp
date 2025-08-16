import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestContext } from '@common/http/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    RequestContext.run(req, res, next);
  }
}
import { RequestContext } from '@common/http/request-context';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    RequestContext.run(req, res, next);
  }
}

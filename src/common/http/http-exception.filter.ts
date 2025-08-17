import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

@Catch(HttpException, EntityNotFoundError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = (exception.getResponse() as any)?.message ?? exception.message;
      return res.status(status).json(message);
    }

    if (exception instanceof EntityNotFoundError) {
      return res.status(HttpStatus.NOT_FOUND).json('Not Found');
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Internal Server Error');
  }
}

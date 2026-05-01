import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<string>();

    // Telegram (telegraf) errors handled separately
    if (ctxType !== 'http') {
      this.logger.error(
        `Non-HTTP exception: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
      return;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error({
      path: req?.url,
      method: req?.method,
      status,
      message,
      stack: (exception as Error)?.stack,
    });

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req?.url,
      message,
    });
  }
}

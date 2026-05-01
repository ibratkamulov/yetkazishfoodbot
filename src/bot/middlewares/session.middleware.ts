import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { BotContext, SessionData } from '../interfaces/bot-context.interface';

@Injectable()
export class SessionMiddleware {
  constructor(private readonly redis: RedisService) {}

  middleware() {
    const TTL = 60 * 60 * 24 * 7; // 7 days
    return async (ctx: BotContext, next: () => Promise<void>) => {
      const userId = ctx.from?.id;
      if (!userId) {
        ctx.session = {};
        return next();
      }

      const key = `session:${userId}`;
      const session = (await this.redis.get<SessionData>(key)) ?? {};
      ctx.session = session;
      await next();
      await this.redis.set(key, ctx.session, TTL);
    };
  }
}

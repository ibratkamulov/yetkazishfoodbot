import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramAdminGuard implements CanActivate {
  private adminIds: Set<number>;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('BOT_ADMIN_IDS') ?? '';
    this.adminIds = new Set(
      raw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const tgCtx: any = context.getArgByIndex(0);
    const userId: number | undefined = tgCtx?.from?.id;
    return userId ? this.adminIds.has(userId) : false;
  }
}

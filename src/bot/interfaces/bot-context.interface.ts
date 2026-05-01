import { Context } from 'telegraf';

export interface SessionData {
  step?: 'awaiting_phone' | 'awaiting_location' | 'browsing' | 'checkout';
  currentCategorySlug?: string;
}

export interface BotContext extends Context {
  session: SessionData;
}

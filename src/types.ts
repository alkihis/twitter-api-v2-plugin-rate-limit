import type { TwitterRateLimit } from 'twitter-api-v2';
import type TwitterApiRateLimitPlugin from './plugin';

export interface ITwitterApiRateLimitGetArgs {
  plugin: TwitterApiRateLimitPlugin;
  endpoint: string;
  method?: string;
}

export interface ITwitterApiRateLimitSetArgs extends ITwitterApiRateLimitGetArgs {
  rateLimit: TwitterRateLimit;
  method: string;
}

export interface ITwitterApiRateLimitStore {
  set(args: ITwitterApiRateLimitSetArgs): Promise<void> | void;
  get(args: ITwitterApiRateLimitGetArgs): Promise<TwitterRateLimit | void> | TwitterRateLimit | void;
}

import type { TwitterRateLimit } from 'twitter-api-v2';
import type { ITwitterApiRateLimitGetArgs, ITwitterApiRateLimitSetArgs, ITwitterApiRateLimitStore } from './types';

type TRateLimitStoredItem = { timeout: NodeJS.Timeout, rateLimit: TwitterRateLimit };

export class TwitterApiRateLimitMemoryStore implements ITwitterApiRateLimitStore {
  protected cache: { [method: string]: { [url: string]: TRateLimitStoredItem } } = {};

  get(args: ITwitterApiRateLimitGetArgs) {
    if (args.method) {
      return this.cache[args.method]?.[args.endpoint]?.rateLimit;
    } else {
      for (const methodUrls of Object.values(this.cache)) {
        if (args.endpoint in methodUrls) {
          return methodUrls[args.endpoint].rateLimit;
        }
      }

      // otherwise: not found
    }
  }

  set(args: ITwitterApiRateLimitSetArgs) {
    const method = args.method;
    const endpoint = args.endpoint;

    if (!this.cache[method]) {
      this.cache[method] = {};
    }

    // Delete possible existing item
    this.delete(method, endpoint);

    const timeUntilResetAndNow = (args.rateLimit.reset * 1000) - Date.now();
    const normalizedTime = timeUntilResetAndNow < 0 ? 0 : timeUntilResetAndNow;

    this.cache[method][endpoint] = {
      rateLimit: args.rateLimit,
      timeout: setTimeout(() => {
        this.delete(method, endpoint);
      }, normalizedTime),
    };

    // Don't make timeout block event loop
    this.cache[method][endpoint].timeout.unref();
  }

  delete(method: string, endpoint: string) {
    const item = this.cache[method]?.[endpoint];

    if (item) {
      clearTimeout(item.timeout);
      delete this.cache[method][endpoint];
    }
  }
}

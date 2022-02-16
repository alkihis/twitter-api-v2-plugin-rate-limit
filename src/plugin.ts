import { TwitterApiRateLimitMemoryStore } from './memory-store';
import type { ITwitterApiClientPlugin, ITwitterApiAfterRequestHookArgs, TwitterRateLimit } from 'twitter-api-v2';
import type { ITwitterApiRateLimitStore } from './types';

const prefixes = {
  v2: 'https://api.twitter.com/2/',
  v2Labs: 'https://api.twitter.com/labs/2/',
  v1: 'https://api.twitter.com/1.1/',
  v1Upload: 'https://upload.twitter.com/1.1/',
  v1Stream: 'https://stream.twitter.com/1.1/',
} as const;

type TAvailablePrefix = keyof typeof prefixes;

export class TwitterApiRateLimitPlugin implements ITwitterApiClientPlugin {
  protected _v1Plugin?: TwitterApiRateLimitPluginWithPrefixV1;
  protected _v2Plugin?: TwitterApiRateLimitPluginWithPrefixV2;
  protected store: ITwitterApiRateLimitStore;

  public constructor(store?: ITwitterApiRateLimitStore) {
    this.store = store || new TwitterApiRateLimitMemoryStore();
  }

  public async onAfterRequest(args: ITwitterApiAfterRequestHookArgs) {
    const rateLimit = args.response.rateLimit;

    if (rateLimit) {
      await this.store.set({
        plugin: this,
        endpoint: args.computedParams.rawUrl,
        method: args.params.method.toUpperCase(),
        rateLimit,
      });
    }
  }

  /**
   * Get the last obtained Twitter rate limit information for {endpoint}.
   */
  public getRateLimit(endpoint: string, method?: string) {
    return this.store.get({
      plugin: this,
      endpoint,
      method,
    });
  }

  /**
   *
   * Tells if you hit the Twitter rate limit for {rateLimit}.
   * Obtain {rateLimit} through {.getRateLimit}.
   */
  public hasHitRateLimit(rateLimit: TwitterRateLimit | void) {
    if (this.isRateLimitStatusObsolete(rateLimit)) {
      return false;
    }
    return rateLimit!.remaining === 0;
  }

  /**
   * Tells if you hit the returned Twitter rate limit for the following {rateLimit} has expired.
   * Obtain {rateLimit} through {.getRateLimit}.
   */
  public isRateLimitStatusObsolete(rateLimit: TwitterRateLimit | void) {
    if (!rateLimit) {
      return true;
    }
    // Timestamps are exprimed in seconds, JS works with ms
    return (rateLimit.reset * 1000) < Date.now();
  }

  public get v1() {
    if (this._v1Plugin) {
      return this._v1Plugin;
    }
    return this._v1Plugin = new TwitterApiRateLimitPluginWithPrefixV1(this, 'v1');
  }

  public get v2() {
    if (this._v2Plugin) {
      return this._v2Plugin;
    }
    return this._v2Plugin = new TwitterApiRateLimitPluginWithPrefixV2(this, 'v2');
  }
}

export class TwitterApiRateLimitPluginWithPrefix {
  constructor(public plugin: TwitterApiRateLimitPlugin, protected prefix: TAvailablePrefix) {}

  public getRateLimit(endpoint: string, method?: string) {
    return this.plugin.getRateLimit(prefixes[this.prefix] + endpoint, method);
  }

  public hasHitRateLimit(rateLimit: TwitterRateLimit | void) {
    return this.plugin.hasHitRateLimit(rateLimit);
  }

  public isRateLimitStatusObsolete(rateLimit: TwitterRateLimit | void) {
    return this.plugin.isRateLimitStatusObsolete(rateLimit);
  }
}

export class TwitterApiRateLimitPluginWithPrefixV1 extends TwitterApiRateLimitPluginWithPrefix {
  public get upload() {
    return new TwitterApiRateLimitPluginWithPrefix(this.plugin, 'v1Upload');
  }

  public get stream() {
    return new TwitterApiRateLimitPluginWithPrefix(this.plugin, 'v1Stream');
  }
}

export class TwitterApiRateLimitPluginWithPrefixV2 extends TwitterApiRateLimitPluginWithPrefix {
  public get labs() {
    return new TwitterApiRateLimitPluginWithPrefix(this.plugin, 'v2Labs');
  }
}

export default TwitterApiRateLimitPlugin;

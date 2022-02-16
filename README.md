# @twitter-api-v2/plugin-rate-limit

> Rate limit plugin for twitter-api-v2

Base plugin to handle rate limit storage. Can be extended with custom stores.
By default, rate limits are stored into process memory.

## Usage

```ts
import { TwitterApi } from 'twitter-api-v2'
import { TwitterApiRateLimitPlugin } from '@twitter-api-v2/plugin-rate-limit'

const rateLimitPlugin = new TwitterApiRateLimitPlugin()
const client = new TwitterApi(yourKeys, { plugins: [rateLimitPlugin] })

// ...make requests...
await client.v2.me()

const currentRateLimitForMe = await rateLimitPlugin.v2.getRateLimit('users/me')
console.log(currentRateLimitForMe.limit) // 75
console.log(currentRateLimitForMe.remaining) // 74

console.log(rateLimitPlugin.hasHitRateLimit(currentRateLimitForMe)) // false - .remaining > 0
console.log(rateLimitPlugin.isRateLimitStatusObsolete(currentRateLimitForMe)) // false - reset hasn't been hit yet
```

Modificators `.v1`/`.v2`/`.v1.stream`/`.v1.upload`/`.v2.labs` prefixes your endpoint with the good URL (like `https://api.twitter.com/2` for `.v2`).

## Create a custom store

You can create a custom store (for Redis, MongoDB, SQL...) to store your rate limit data.
Store is given as the first argument of constructor of `TwitterApiRateLimitPlugin`.

A store is a class which implements `ITwitterApiRateLimitStore`.

You can find a example of store (the default one) `TwitterApiRateLimitMemoryStore`, [here](./src/memory-store.ts).

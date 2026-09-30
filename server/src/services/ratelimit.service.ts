import { redisClient } from '../config/redis';

const RATE_LIMIT_LUA_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = tonumber(redis.call('GET', key) or '0')

if current >= limit then
    return {0, current}
else
    local newVal = redis.call('INCR', key)
    if newVal == 1 then
        redis.call('EXPIRE', key, ttl)
    end
    return {1, newVal}
end
`;

export interface RateLimitResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  hourKey: string;
  hourString: string;
}

export class RateLimitService {
  /**
   * Generates the Redis key for per-sender hourly rate limiting.
   * Format: rate_limit:sender:<senderId>:<YYYY-MM-DD-HH>
   */
  static getRateLimitKey(senderId: string, date: Date = new Date()) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hour = pad(date.getUTCHours());

    const hourString = `${year}-${month}-${day}-${hour}`;
    const key = `rate_limit:sender:${senderId}:${hourString}`;
    return { key, hourString };
  }

  /**
   * Atomically reserve a rate limit slot for a sender in the current hour using Redis Lua script.
   */
  static async reserveSlot(senderId: string, limit: number): Promise<RateLimitResult> {
    const now = new Date();
    const { key, hourString } = this.getRateLimitKey(senderId, now);
    const ttlSeconds = 7200; // Retain key for 2 hours for audit/verification

    try {
      const res = (await redisClient.eval(
        RATE_LIMIT_LUA_SCRIPT,
        1,
        key,
        limit.toString(),
        ttlSeconds.toString()
      )) as [number, number];

      const allowed = res[0] === 1;
      const currentUsage = Number(res[1]);

      return {
        allowed,
        currentUsage,
        limit,
        hourKey: key,
        hourString,
      };
    } catch (error: any) {
      console.error(`❌ [RateLimit] Lua script error for key ${key}:`, error.message);
      // Fail open to prevent blocking execution if Redis script fails unexpectedly
      return {
        allowed: true,
        currentUsage: 0,
        limit,
        hourKey: key,
        hourString,
      };
    }
  }

  /**
   * Calculate delay to the beginning of the next UTC hour for rescheduling.
   */
  static getNextHourDelay(now: Date = new Date()): { delayMs: number; nextHourDate: Date } {
    const nextHourDate = new Date(now);
    nextHourDate.setUTCMonth(now.getUTCMonth());
    nextHourDate.setUTCDate(now.getUTCDate());
    nextHourDate.setUTCHours(now.getUTCHours() + 1, 0, 0, 0); // 00m:00s:00ms of next UTC hour

    const delayMs = Math.max(1000, nextHourDate.getTime() - now.getTime());
    return { delayMs, nextHourDate };
  }

  /**
   * Helper method to inspect current rate limit usage for a sender without incrementing.
   */
  static async getUsage(senderId: string, date: Date = new Date()): Promise<number> {
    const { key } = this.getRateLimitKey(senderId, date);
    const val = await redisClient.get(key);
    return val ? parseInt(val, 10) : 0;
  }
}

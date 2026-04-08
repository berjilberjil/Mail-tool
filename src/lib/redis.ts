import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Shared Redis connection for BullMQ.
 * `maxRetriesPerRequest: null` is required by BullMQ.
 */
export const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

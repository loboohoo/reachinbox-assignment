import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

export const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully for BullMQ coordination');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

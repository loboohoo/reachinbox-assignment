import dns from 'dns';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDatabase, prisma } from './config/database';

// Force Node.js to prefer IPv4 over IPv6 to prevent undici DNS timeouts on Windows
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

// Bypass local SSL inspection/proxy TLS errors on Windows development machines
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import { redisClient } from './config/redis';
import { QueueService } from './services/queue.service';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import emailRoutes from './routes/email.routes';
import slackRoutes from './routes/slack.routes';
import { setupBullBoard } from './config/bullboard';
import { checkElasticsearchHealth } from './config/elasticsearch';
import { ElasticsearchService } from './services/elasticsearch.service';
import './workers/email.worker'; // Boot BullMQ worker

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendUrl,
    credentials: true, // Allow cookies over CORS
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

// Bull Board Queue Dashboard Route
app.use('/admin/queues', setupBullBoard());

// Health Check & Infrastructure Audit Route
app.get('/health', async (_req, res) => {
  try {
    // 1. Check PostgreSQL
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    // 2. Check Redis
    let redisStatus = 'disconnected';
    try {
      const ping = await redisClient.ping();
      if (ping === 'PONG') redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }

    // 3. Get BullMQ Metrics
    const queueMetrics = await QueueService.getQueueMetrics();

    res.json({
      status: 'ok',
      service: 'ReachInbox Backend Stage 5 (Google OAuth)',
      timestamp: new Date().toISOString(),
      infrastructure: {
        database: {
          type: 'PostgreSQL (Prisma ORM)',
          status: dbStatus,
        },
        redis: {
          type: 'Redis 7',
          status: redisStatus,
        },
        bullmq: {
          queueName: 'email-queue',
          concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
          metrics: queueMetrics,
        },
        bullBoard: {
          url: `http://localhost:${PORT}/admin/queues`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Start Server & Connect Services
async function startServer() {
  await connectDatabase();

  // Initialize Elasticsearch health check & mapping index
  const esConnected = await checkElasticsearchHealth();
  if (esConnected) {
    await ElasticsearchService.ensureIndexExists();
  }

  app.listen(PORT, () => {
    console.log(`🚀 [Server] ReachInbox Backend running on http://localhost:${PORT}`);
    console.log(`🔑 Google Auth Endpoint: http://localhost:${PORT}/api/auth/google`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`🎯 Bull Board Dashboard: http://localhost:${PORT}/admin/queues`);
    console.log(`🔍 Email Search API: http://localhost:${PORT}/api/emails/search?q=test`);
  });
}

startServer();

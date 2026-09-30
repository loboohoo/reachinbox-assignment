import { Request, Response } from 'express';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { prisma } from '../config/database';

export class EmailController {
  /**
   * GET /api/emails/search?q=<query>
   * Performs full-text search across subject, recipient, and body.
   * Falls back to PostgreSQL search if Elasticsearch is unreachable.
   */
  static async searchEmails(req: Request, res: Response) {
    const query = (req.query.q as string || '').trim();

    if (!query) {
      res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
      return;
    }

    try {
      // 1. Try searching via Elasticsearch
      const results = await ElasticsearchService.searchEmails(query);
      res.json({
        success: true,
        source: 'Elasticsearch',
        count: results.length,
        data: results,
      });
    } catch (esError: any) {
      console.warn(`⚠️ [Search Fallback] Elasticsearch search failed (${esError.message}). Falling back to PostgreSQL.`);

      try {
        // 2. Fallback to PostgreSQL database search
        const pgResults = await prisma.email.findMany({
          where: {
            OR: [
              { subject: { contains: query, mode: 'insensitive' } },
              { recipientEmail: { contains: query, mode: 'insensitive' } },
              { body: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 50,
          orderBy: { createdAt: 'desc' },
        });

        res.json({
          success: true,
          source: 'PostgreSQL (Fallback)',
          count: pgResults.length,
          data: pgResults,
        });
      } catch (pgError: any) {
        res.status(500).json({ success: false, error: pgError.message });
      }
    }
  }
}

import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const nodeUrl = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

export const esClient = new Client({
  node: nodeUrl,
  maxRetries: 3,
  requestTimeout: 5000,
});

export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    const health = await esClient.cluster.health({});
    console.log(`✅ Elasticsearch cluster connected. Status: ${health.status}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ Elasticsearch unavailable at ${nodeUrl}: ${error.message}. Continuing in fallback mode.`);
    return false;
  }
}

import { esClient } from '../config/elasticsearch';

export interface EmailIndexPayload {
  emailId: string;
  campaignId?: string;
  senderId?: string;
  sender?: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt?: Date | string | null;
  sentAt?: Date | string | null;
  createdAt?: Date | string;
}

export class ElasticsearchService {
  static INDEX_NAME = 'emails';

  /**
   * Ensures the `emails` index and mappings exist in Elasticsearch.
   */
  static async ensureIndexExists(): Promise<void> {
    try {
      const exists = await esClient.indices.exists({ index: this.INDEX_NAME });
      if (!exists) {
        await esClient.indices.create({
          index: this.INDEX_NAME,
          mappings: {
            properties: {
              emailId: { type: 'keyword' },
              campaignId: { type: 'keyword' },
              senderId: { type: 'keyword' },
              sender: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              createdAt: { type: 'date' },
            },
          },
        });
        console.log(`✅ Elasticsearch index '${this.INDEX_NAME}' created with mappings.`);
      }
    } catch (error: any) {
      console.warn(`⚠️ [Elasticsearch Warning] Could not verify/create index '${this.INDEX_NAME}':`, error.message);
    }
  }

  /**
   * Index or upsert an email document into Elasticsearch.
   * Fail-safe: does not throw on error.
   */
  static async indexEmail(payload: EmailIndexPayload): Promise<void> {
    try {
      await esClient.index({
        index: this.INDEX_NAME,
        id: payload.emailId,
        document: {
          emailId: payload.emailId,
          campaignId: payload.campaignId || null,
          senderId: payload.senderId || null,
          sender: payload.sender || '',
          recipient: payload.recipient,
          subject: payload.subject,
          body: payload.body,
          status: payload.status,
          scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt).toISOString() : null,
          sentAt: payload.sentAt ? new Date(payload.sentAt).toISOString() : null,
          createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : new Date().toISOString(),
        },
      });
      console.log(`🔍 [Elasticsearch] Indexed email document: ${payload.emailId}`);
    } catch (error: any) {
      console.warn(`⚠️ [Elasticsearch Warning] Failed to index email ${payload.emailId}:`, error.message);
    }
  }

  /**
   * Update email document status (e.g. SENT, FAILED, QUEUED) in Elasticsearch.
   * Fail-safe: does not throw on error.
   */
  static async updateEmailStatus(
    emailId: string,
    status: string,
    extraFields: Record<string, any> = {}
  ): Promise<void> {
    try {
      const doc: Record<string, any> = {
        status,
        ...extraFields,
      };

      if (extraFields.sentAt) {
        doc.sentAt = new Date(extraFields.sentAt).toISOString();
      }
      if (extraFields.scheduledAt) {
        doc.scheduledAt = new Date(extraFields.scheduledAt).toISOString();
      }

      await esClient.update({
        index: this.INDEX_NAME,
        id: emailId,
        doc,
        doc_as_upsert: true,
      });
      console.log(`🔍 [Elasticsearch] Updated status for email ${emailId} -> ${status}`);
    } catch (error: any) {
      console.warn(`⚠️ [Elasticsearch Warning] Failed to update status for ${emailId}:`, error.message);
    }
  }

  /**
   * Search emails in Elasticsearch across subject, recipient, and body.
   */
  static async searchEmails(query: string) {
    try {
      const response = await esClient.search({
        index: this.INDEX_NAME,
        query: {
          multi_match: {
            query,
            fields: ['subject^3', 'recipient^2', 'body', 'sender'],
            fuzziness: 'AUTO',
          },
        },
      });

      return response.hits.hits.map((hit) => hit._source);
    } catch (error: any) {
      console.warn(`⚠️ [Elasticsearch Warning] Search query failed:`, error.message);
      throw error;
    }
  }
}

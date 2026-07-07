/**
 * Bitrix24 Email Marketing API
 * Handles email campaigns, templates, and parish communications
 */

import type { Bitrix24Client } from '../client';
import type { Bitrix24Response, Bitrix24ListResponse } from '../types';

// Email Template Types
export type EmailTemplateType =
  | 'weekly_bulletin'
  | 'donation_receipt'
  | 'sacrament_confirmation'
  | 'event_reminder'
  | 'newsletter'
  | 'prayer_request'
  | 'mass_intention';

// Email Template
export interface Bitrix24EmailTemplate {
  ID: string;
  NAME: string;
  SUBJECT: string;
  BODY: string;
  UF_TEMPLATE_TYPE?: EmailTemplateType;
  UF_PARISH_CODE?: string;
  UF_LANGUAGE?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
}

// Email Campaign
export interface Bitrix24EmailCampaign {
  ID: string;
  NAME: string;
  SUBJECT: string;
  BODY: string;
  STATUS: string;
  RECIPIENT_COUNT: number;
  SENT_COUNT: number;
  OPENED_COUNT: number;
  CLICKED_COUNT: number;
  DATE_CREATE?: string;
  DATE_SENT?: string;
}

// Send Email Params
export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  fromName?: string;
  replyTo?: string;
  templateType?: EmailTemplateType;
  parishCode?: string;
}

// Campaign Stats
export interface CampaignStats {
  id: string;
  status: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

/**
 * Bitrix24 Email Marketing API
 */
export class EmailApi {
  constructor(private readonly client: Bitrix24Client) {}

  // Template Management

  /**
   * Get email template by ID
   */
  async getTemplate(templateId: string): Promise<Bitrix24Response<Bitrix24EmailTemplate>> {
    return this.client.get('sender.template.get', { id: templateId });
  }

  /**
   * List email templates
   */
  async listTemplates(params?: {
    parishCode?: string;
    templateType?: EmailTemplateType;
  }): Promise<Bitrix24ListResponse<Bitrix24EmailTemplate>> {
    const filter: Record<string, unknown> = {};
    if (params?.parishCode) filter.UF_PARISH_CODE = params.parishCode;
    if (params?.templateType) filter.UF_TEMPLATE_TYPE = params.templateType;

    return this.client.get('sender.template.list', { filter });
  }

  /**
   * Create email template
   */
  async createTemplate(params: {
    name: string;
    subject: string;
    body: string;
    templateType?: EmailTemplateType;
    parishCode?: string;
    language?: string;
  }): Promise<Bitrix24Response<{ result: number }>> {
    const fields: Record<string, unknown> = {
      NAME: params.name,
      SUBJECT: params.subject,
      BODY: params.body,
      UF_LANGUAGE: params.language || 'lt',
    };

    if (params.templateType) fields.UF_TEMPLATE_TYPE = params.templateType;
    if (params.parishCode) fields.UF_PARISH_CODE = params.parishCode;

    return this.client.post('sender.template.add', { fields });
  }

  // Email Sending

  /**
   * Send an email
   */
  async send(params: SendEmailParams): Promise<{ messageId: string; recipients: number }> {
    const fields: Record<string, unknown> = {
      TO: params.to,
      SUBJECT: params.subject,
      BODY: params.body,
    };

    if (params.fromName) fields.FROM_NAME = params.fromName;
    if (params.replyTo) fields.REPLY_TO = params.replyTo;
    if (params.templateType) fields.UF_TEMPLATE_TYPE = params.templateType;
    if (params.parishCode) fields.UF_PARISH_CODE = params.parishCode;

    const response = await this.client.post<Bitrix24Response<{ ID: string }>>('sender.mail.send', fields);
    
    return {
      messageId: response.result?.ID || '',
      recipients: params.to.length,
    };
  }

  /**
   * Send email to a specific contact
   */
  async sendToContact(params: {
    contactId: string;
    subject: string;
    body: string;
    templateType?: EmailTemplateType;
  }): Promise<{ messageId: string }> {
    const response = await this.client.post<Bitrix24Response<{ ID: string }>>('crm.mail.send', {
      CONTACT_ID: params.contactId,
      SUBJECT: params.subject,
      BODY: params.body,
    });

    return { messageId: response.result?.ID || '' };
  }

  /**
   * Send donation receipt
   */
  async sendDonationReceipt(params: {
    contactId: string;
    dealId: string;
    amount: number;
    currency: string;
    donationType: string;
  }): Promise<{ messageId: string }> {
    const subject = `Donation Receipt - ${params.currency}${params.amount}`;
    const body = `
Dear Donor,

Thank you for your ${params.donationType} of ${params.currency}${params.amount}.

Your generosity supports our mission.

God bless you.
    `.trim();

    const result = await this.sendToContact({
      contactId: params.contactId,
      subject,
      body,
      templateType: 'donation_receipt',
    });

    // Mark deal as receipt sent
    await this.client.deal.update(params.dealId, { UF_RECEIPT_SENT: 'Y' });

    return result;
  }

  // Campaign Management

  /**
   * Create email campaign
   */
  async createCampaign(params: {
    name: string;
    subject: string;
    body: string;
    recipientList: string;
    parishCode?: string;
  }): Promise<{ campaignId: string }> {
    const fields: Record<string, unknown> = {
      NAME: params.name,
      SUBJECT: params.subject,
      BODY: params.body,
      RECIPIENT_LIST: params.recipientList,
    };

    if (params.parishCode) fields.UF_PARISH_CODE = params.parishCode;

    const response = await this.client.post<{ result: number }>(
      'sender.campaign.add',
      { fields }
    );

    return { campaignId: String(response.result) };
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string): Promise<boolean> {
    const response = await this.client.post<{ result: boolean }>(
      'sender.campaign.send',
      { id: campaignId }
    );
    return response.result ?? false;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const response = await this.client.get<Bitrix24Response<Bitrix24EmailCampaign>>(
      'sender.campaign.get',
      { id: campaignId }
    );

    const campaign = response.result;
    const sent = campaign?.SENT_COUNT ?? 0;
    const opened = campaign?.OPENED_COUNT ?? 0;
    const clicked = campaign?.CLICKED_COUNT ?? 0;

    return {
      id: campaign?.ID || campaignId,
      status: campaign?.STATUS || 'unknown',
      recipients: campaign?.RECIPIENT_COUNT ?? 0,
      sent,
      opened,
      clicked,
      openRate: sent > 0 ? opened / sent : 0,
      clickRate: sent > 0 ? clicked / sent : 0,
    };
  }

  // Parish-specific methods

  /**
   * Send weekly bulletin to parish subscribers
   */
  async sendWeeklyBulletin(params: {
    parishCode: string;
    subject: string;
    body: string;
  }): Promise<{ messageId: string; recipients: number }> {
    // Get parish contacts first
    const contacts = await this.client.contact.list({
      filter: { UF_PARISH_CODE: params.parishCode },
      select: ['EMAIL'],
    });

    const recipients = contacts.result
      ?.flatMap((c) => c.EMAIL?.map((e) => e.VALUE) ?? [])
      .filter(Boolean) ?? [];

    if (recipients.length === 0) {
      return { messageId: '', recipients: 0 };
    }

    return this.send({
      to: recipients,
      subject: params.subject,
      body: params.body,
      templateType: 'weekly_bulletin',
      parishCode: params.parishCode,
    });
  }
}

export default EmailApi;

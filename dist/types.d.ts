export type M2RProduct = 'backfindr' | 'm2rleads' | 'm2rmenu' | 'm2rfood' | 'm2rads' | 'm2rplace' | 'jack_chicken';
export type M2RActorType = 'user' | 'system' | 'bot';
export type M2REventType = 'lead_found' | 'lead_scored' | 'message_generated' | 'campaign_created' | 'campaign_paused' | 'campaign_action_proposed' | 'campaign_action_applied' | 'ad_metrics_synced' | 'media_generated' | 'media_approved' | 'media_rejected' | 'media_published' | 'media_publish_failed' | 'media_engagement_synced' | 'signup' | 'subscription_started' | 'subscription_cancelled' | 'payment_received' | 'churn_detected' | 'demo_requested';
export interface M2REvent<TPayload = Record<string, unknown>> {
    /** UUID do evento */
    id: string;
    type: M2REventType;
    product: M2RProduct;
    /** ISO 8601 */
    timestamp: string;
    /** Ex: 'campaign' | 'lead' | 'user' */
    entityType?: string;
    entityId?: string;
    actorType: M2RActorType;
    /** id do usuário, ou identificador do bot (ex: 'automation-engine') */
    actorId?: string;
    payload: TPayload;
    metadata?: Record<string, unknown>;
}
/** Formato de input para criar um evento — id/timestamp são preenchidos por quem grava. */
export type M2REventInput<TPayload = Record<string, unknown>> = Omit<M2REvent<TPayload>, 'id' | 'timestamp'>;
export interface M2REventPayloads {
    lead_found: {
        leadId: string;
        origem: string;
        score: number;
    };
    lead_scored: {
        leadId: string;
        score: number;
        criterios: Record<string, number>;
    };
    message_generated: {
        entityId: string;
        canal: string;
        texto: string;
    };
    campaign_created: {
        campaignId: string;
        campaignName: string;
        productId: number | null;
    };
    campaign_paused: {
        campaignId: string;
        motivo: string;
    };
    campaign_action_proposed: {
        campaignId: string;
        actionType: string;
        reason: string;
        beforeValue: string;
        afterValue: string;
    };
    campaign_action_applied: {
        campaignId: string;
        actionType: string;
        reason: string;
        beforeValue: string;
        afterValue: string;
        mode: 'dry_run' | 'live';
    };
    ad_metrics_synced: {
        campaignId: string;
        impressions: number;
        clicks: number;
        period: string;
    };
    media_generated: {
        mediaAssetId: string;
        productSlug: string;
        personaSlug: string | null;
        category: string;
        mediaType: 'image' | 'video';
        generationSource: string;
    };
    media_approved: {
        mediaAssetId: string;
        approvedBy: string;
    };
    media_rejected: {
        mediaAssetId: string;
        rejectedBy: string;
        motivo: string;
    };
    media_published: {
        mediaAssetId: string;
        mediaTargetId: string;
        platform: string;
        accountRef: string;
        externalPostId: string;
    };
    media_publish_failed: {
        mediaAssetId: string;
        mediaTargetId: string;
        platform: string;
        motivo: string;
    };
    media_engagement_synced: {
        mediaTargetId: string;
        platform: string;
        impressions: number | null;
        reach: number | null;
        likes: number | null;
        comments: number | null;
        shares: number | null;
        clicks: number | null;
        periodStart: string;
        periodEnd: string;
    };
    signup: {
        userId: string;
        email: string;
        origem: string;
    };
    demo_requested: {
        contato: string;
        produto: string;
    };
    subscription_started: {
        userId: string;
        plano: string;
        valor: number;
    };
    subscription_cancelled: {
        userId: string;
        plano: string;
        motivo: string;
    };
    payment_received: {
        userId: string;
        valor: number;
        referencia: string;
    };
    churn_detected: {
        userId: string;
        sinal: string;
    };
}

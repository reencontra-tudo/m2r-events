// m2r-events — schema de eventos padronizado entre produtos M2RPrime.
// Fonte única de verdade para o formato do envelope e os tipos de evento
// conhecidos. Cada produto grava eventos no formato abaixo na sua PRÓPRIA
// tabela `events` — não existe (ainda) um coletor central. Quando a camada
// M2R Intelligence existir, esse formato é o que ela vai consumir.

export type M2RProduct = 'backfindr' | 'm2rleads' | 'm2rmenu' | 'm2rfood' | 'm2rads';

export type M2RActorType = 'user' | 'system' | 'bot';

// Tipos de evento conhecidos. Ao adicionar um novo, documentar em EVENTS.md
// (produto emissor, payload esperado, e quem consome).
export type M2REventType =
  // M2RLeads
  | 'lead_found'
  | 'lead_scored'
  | 'message_generated'
  // M2RAds
  | 'campaign_created'
  | 'campaign_paused'
  | 'campaign_action_proposed'
  | 'campaign_action_applied'
  | 'ad_metrics_synced'
  // Transversais — qualquer produto pode emitir
  | 'signup'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'payment_received'
  | 'churn_detected'
  | 'demo_requested';

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

import type { M2RActorType, M2REventInput, M2REventType, M2RProduct } from './types.js';

const EVENT_TYPES: readonly M2REventType[] = [
  'lead_found',
  'lead_scored',
  'message_generated',
  'campaign_created',
  'campaign_paused',
  'campaign_action_proposed',
  'campaign_action_applied',
  'ad_metrics_synced',
  'signup',
  'subscription_started',
  'subscription_cancelled',
  'payment_received',
  'churn_detected',
  'demo_requested',
  // v0.3.0 — faltavam aqui (o validador rejeitava eventos válidos da Central de Mídia)
  'media_generated',
  'media_approved',
  'media_rejected',
  'media_published',
  'media_publish_failed',
  'media_engagement_synced',
  // v0.4.0 — auditoria
  'auth_login_succeeded',
  'auth_login_failed',
  'auth_password_changed',
  'auth_password_reset_requested',
  'auth_impersonation_started',
  'admin_change',
];

// v0.4.0: 'm2rplace' e 'jack_chicken' existiam no tipo desde a v0.3.0 mas faltavam aqui.
const PRODUCTS: readonly M2RProduct[] = ['backfindr', 'm2rleads', 'm2rmenu', 'm2rfood', 'm2rads', 'm2rplace', 'jack_chicken'];

const ACTOR_TYPES: readonly M2RActorType[] = ['user', 'system', 'bot'];

/**
 * Checagem estrutural em tempo de execução do envelope do evento (sem
 * checar o payload — cada produto valida o próprio payload por tipo se
 * quiser, usando `M2REventPayloads`). Existe pra quem consome eventos vindos
 * de fora do type-checker do TypeScript — deserializado de JSON, lido de
 * fila, etc — onde o compilador não ajuda.
 */
export function isM2REventInput(input: unknown): input is M2REventInput {
  if (typeof input !== 'object' || input === null) return false;
  const e = input as Record<string, unknown>;

  if (typeof e.type !== 'string' || !EVENT_TYPES.includes(e.type as M2REventType)) return false;
  if (typeof e.product !== 'string' || !PRODUCTS.includes(e.product as M2RProduct)) return false;
  if (typeof e.actorType !== 'string' || !ACTOR_TYPES.includes(e.actorType as M2RActorType)) return false;
  if (e.payload === undefined || e.payload === null || typeof e.payload !== 'object') return false;

  if (e.entityType !== undefined && typeof e.entityType !== 'string') return false;
  if (e.entityId !== undefined && typeof e.entityId !== 'string') return false;
  if (e.actorId !== undefined && typeof e.actorId !== 'string') return false;
  if (e.metadata !== undefined && (e.metadata === null || typeof e.metadata !== 'object')) return false;

  return true;
}

/** Mesma checagem que {@link isM2REventInput}, mas lança em vez de devolver boolean. */
export function assertM2REventInput(input: unknown): asserts input is M2REventInput {
  if (!isM2REventInput(input)) {
    throw new TypeError(`m2r-events: entrada não é um M2REventInput válido: ${JSON.stringify(input)}`);
  }
}

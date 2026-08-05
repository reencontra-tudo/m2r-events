const EVENT_TYPES = [
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
];
const PRODUCTS = ['backfindr', 'm2rleads', 'm2rmenu', 'm2rfood', 'm2rads'];
const ACTOR_TYPES = ['user', 'system', 'bot'];
/**
 * Checagem estrutural em tempo de execução do envelope do evento (sem
 * checar o payload — cada produto valida o próprio payload por tipo se
 * quiser, usando `M2REventPayloads`). Existe pra quem consome eventos vindos
 * de fora do type-checker do TypeScript — deserializado de JSON, lido de
 * fila, etc — onde o compilador não ajuda.
 */
export function isM2REventInput(input) {
    if (typeof input !== 'object' || input === null)
        return false;
    const e = input;
    if (typeof e.type !== 'string' || !EVENT_TYPES.includes(e.type))
        return false;
    if (typeof e.product !== 'string' || !PRODUCTS.includes(e.product))
        return false;
    if (typeof e.actorType !== 'string' || !ACTOR_TYPES.includes(e.actorType))
        return false;
    if (e.payload === undefined || e.payload === null || typeof e.payload !== 'object')
        return false;
    if (e.entityType !== undefined && typeof e.entityType !== 'string')
        return false;
    if (e.entityId !== undefined && typeof e.entityId !== 'string')
        return false;
    if (e.actorId !== undefined && typeof e.actorId !== 'string')
        return false;
    if (e.metadata !== undefined && (e.metadata === null || typeof e.metadata !== 'object'))
        return false;
    return true;
}
/** Mesma checagem que {@link isM2REventInput}, mas lança em vez de devolver boolean. */
export function assertM2REventInput(input) {
    if (!isM2REventInput(input)) {
        throw new TypeError(`m2r-events: entrada não é um M2REventInput válido: ${JSON.stringify(input)}`);
    }
}

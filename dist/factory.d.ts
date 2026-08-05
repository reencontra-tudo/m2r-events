import type { M2REvent, M2REventInput } from './types.js';
/**
 * Preenche `id` (UUID) e `timestamp` (ISO 8601) de forma consistente — uso
 * opcional. Produtos que geram esses campos de outro jeito (ex: M2RAds hoje
 * usa id serial + timestamp do próprio Postgres na tabela local `events`,
 * não um UUID) não são obrigados a adotar isso; existe pra quem quiser o
 * envelope canônico completo, especialmente pensando numa futura camada
 * central que precise correlacionar eventos entre produtos por UUID.
 */
export declare function createEvent<TPayload>(input: M2REventInput<TPayload>): M2REvent<TPayload>;

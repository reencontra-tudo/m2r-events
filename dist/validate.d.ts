import type { M2REventInput } from './types.js';
/**
 * Checagem estrutural em tempo de execução do envelope do evento (sem
 * checar o payload — cada produto valida o próprio payload por tipo se
 * quiser, usando `M2REventPayloads`). Existe pra quem consome eventos vindos
 * de fora do type-checker do TypeScript — deserializado de JSON, lido de
 * fila, etc — onde o compilador não ajuda.
 */
export declare function isM2REventInput(input: unknown): input is M2REventInput;
/** Mesma checagem que {@link isM2REventInput}, mas lança em vez de devolver boolean. */
export declare function assertM2REventInput(input: unknown): asserts input is M2REventInput;

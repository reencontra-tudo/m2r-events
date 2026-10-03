import type { M2REventType } from './types.js';
export type AuthFailureReason = 'usuario_inexistente' | 'senha_incorreta' | 'sem_senha_cadastrada' | 'conta_inativa' | 'empresa_bloqueada' | 'conta_de_sistema' | 'sem_permissao' | 'limite_de_tentativas' | 'token_invalido' | 'erro_interno';
export interface AuditPayloads {
    auth_login_succeeded: {
        metodo: string;
        ipMascarado: string | null;
    };
    auth_login_failed: {
        metodo: string;
        motivo: AuthFailureReason;
        /** ex. "m***@g***.com" — nunca o e-mail em claro */
        identificadorMascarado: string;
        /** sha256 do identificador normalizado: correlaciona tentativas sem expor o dado */
        identificadorHash: string;
        ipMascarado: string | null;
    };
    auth_password_changed: {
        metodo: 'troca' | 'redefinicao';
        ipMascarado: string | null;
    };
    auth_password_reset_requested: {
        identificadorMascarado: string;
        identificadorHash: string;
        ipMascarado: string | null;
    };
    auth_impersonation_started: {
        alvoId: string;
        alvoTipo: string;
        ipMascarado: string | null;
    };
    admin_change: {
        /** ex. 'plano_alterado', 'preco_alterado', 'trial_estendido', 'status_empresa_alterado', 'config_pagamento_alterada' */
        acao: string;
        recurso: string;
        recursoId: string;
        antes: Record<string, unknown> | null;
        depois: Record<string, unknown> | null;
        ipMascarado: string | null;
    };
}
export type RetentionClass = 'acesso' | 'comercial' | 'negocio';
/** Dias de retenção por classe. acesso = 6 meses; comercial = 5 anos; negocio = 24 meses. */
export declare const RETENTION_DAYS: Record<RetentionClass, number>;
export declare function retentionClassOf(type: M2REventType, payload?: {
    acao?: string;
}): RetentionClass;
export declare function retentionUntil(type: M2REventType, payload?: {
    acao?: string;
}, from?: Date): Date;
/** "marcos@gmail.com" → "m***@g***.com". Valor inválido vira "***". */
export declare function maskEmail(email: string | null | undefined): string;
/** IPv4 zera o último octeto; IPv6 mantém 3 grupos; x-forwarded-for usa o 1º IP. */
export declare function maskIp(ip: string | null | undefined): string | null;
/** sha256 hex do identificador normalizado (trim + minúsculas). */
export declare function hashIdentifier(id: string): string;
export declare const REDACTED = "[REDACTED]";
export declare function redactText(texto: string): string;
/**
 * Cópia profunda de `valor` com segredos trocados por "[REDACTED]":
 * - valor de qualquer chave com nome de segredo (password, token, apiKey…);
 * - segredos reconhecíveis dentro de strings (Bearer, JWT, URL com senha, chaves de API).
 * Nunca lança; ciclos viram "[CIRCULAR]".
 */
export declare function redactSecrets<T>(valor: T, _vistos?: WeakSet<object>): T;

// Auditoria (v0.4.0) — contrato comum para login e ações de administrador.
//
// Regras (levantamento de 02/10/2026, ~/auditoria/levantamento-logs-historicos.md §5):
// 1. Grava primeiro na tabela `events` do PRÓPRIO produto; envio a um coletor é posterior.
// 2. Nunca dado pessoal em claro: e-mail mascarado + hash, IP mascarado.
// 3. Nunca segredo: todo payload passa por `redigirSegredos` antes de gravar.
// 4. Retenção por classe: acesso 6 meses (Marco Civil, art. 15); comercial 5 anos.
import { createHash } from 'node:crypto';
/** Dias de retenção por classe. acesso = 6 meses; comercial = 5 anos; negocio = 24 meses. */
export const RETENTION_DAYS = {
    acesso: 183,
    comercial: 1827,
    negocio: 730,
};
/** Ações de `admin_change` que são acesso (6 meses) e não comerciais (5 anos). */
const ADMIN_ACOES_DE_ACESSO = new Set(['permissao_alterada', 'usuario_criado', 'usuario_excluido', 'usuario_editado']);
export function retentionClassOf(type, payload) {
    if (type.startsWith('auth_'))
        return 'acesso';
    if (type === 'admin_change')
        return payload?.acao && ADMIN_ACOES_DE_ACESSO.has(payload.acao) ? 'acesso' : 'comercial';
    return 'negocio';
}
export function retentionUntil(type, payload, from = new Date()) {
    const dias = RETENTION_DAYS[retentionClassOf(type, payload)];
    return new Date(from.getTime() + dias * 24 * 60 * 60 * 1000);
}
// ─── Mascaramento ────────────────────────────────────────────────────────────
/** "marcos@gmail.com" → "m***@g***.com". Valor inválido vira "***". */
export function maskEmail(email) {
    if (!email || typeof email !== 'string')
        return '***';
    const [local, dominio] = email.trim().split('@');
    if (!local || !dominio)
        return '***';
    const partes = dominio.split('.');
    const tld = partes.length > 1 ? partes.slice(1).join('.') : '';
    return `${local[0]}***@${partes[0][0] ?? ''}***${tld ? '.' + tld : ''}`;
}
/** IPv4 zera o último octeto; IPv6 mantém 3 grupos; x-forwarded-for usa o 1º IP. */
export function maskIp(ip) {
    if (!ip || typeof ip !== 'string')
        return null;
    let v = ip.split(',')[0].trim();
    if (v.startsWith('::ffff:'))
        v = v.slice(7);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v))
        return v.replace(/\.\d{1,3}$/, '.0');
    if (v.includes(':'))
        return v.split(':').slice(0, 3).join(':') + '::';
    return null;
}
/** sha256 hex do identificador normalizado (trim + minúsculas). */
export function hashIdentifier(id) {
    return createHash('sha256').update(String(id).trim().toLowerCase()).digest('hex');
}
// ─── Redação de segredos ─────────────────────────────────────────────────────
export const REDACTED = '[REDACTED]';
/** Chaves cujo VALOR nunca pode ser gravado (comparação sem caixa, por trecho). */
const CHAVES_SECRETAS = /pass(word)?|senha|secret|token|api[_-]?key|apikey|authorization|cookie|session|credential|private[_-]?key|access[_-]?key|database[_-]?url|connection[_-]?string|^jwt|signature|cvv|card[_-]?number|^pin$/i;
/** Padrões de segredo dentro de TEXTO livre. */
const PADROES_SECRETOS = [
    [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/g, `$1 ${REDACTED}`],
    [/\b([a-z][a-z0-9+.-]*:\/\/)[^\s:/@]+:[^\s@/]+@/gi, `$1${REDACTED}@`], // user:senha@ em URL
    [/([?&](?:token|key|secret|signature|sig|code|password|senha|access_token|api_key|apikey)=)[^&#\s]+/gi, `$1${REDACTED}`],
    [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, REDACTED], // JWT
    [/\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{8,}\b/g, REDACTED], // Stripe
    [/\bsk-[A-Za-z0-9_-]{16,}\b/g, REDACTED], // OpenAI
    [/\bre_[A-Za-z0-9_]{16,}\b/g, REDACTED], // Resend
    [/\bEAA[A-Za-z0-9]{40,}\b/g, REDACTED], // Meta
    [/\b(APP_USR|TEST)-\d{6,}-[A-Za-z0-9-]{10,}\b/g, REDACTED], // Mercado Pago
    [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, REDACTED], // GitHub
    [/\bAKIA[0-9A-Z]{16}\b/g, REDACTED], // AWS
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, REDACTED],
];
export function redactText(texto) {
    let r = texto;
    for (const [re, sub] of PADROES_SECRETOS)
        r = r.replace(re, sub);
    return r;
}
/**
 * Cópia profunda de `valor` com segredos trocados por "[REDACTED]":
 * - valor de qualquer chave com nome de segredo (password, token, apiKey…);
 * - segredos reconhecíveis dentro de strings (Bearer, JWT, URL com senha, chaves de API).
 * Nunca lança; ciclos viram "[CIRCULAR]".
 */
export function redactSecrets(valor, _vistos = new WeakSet()) {
    if (typeof valor === 'string')
        return redactText(valor);
    if (valor === null || typeof valor !== 'object')
        return valor;
    if (valor instanceof Date)
        return valor;
    if (_vistos.has(valor))
        return '[CIRCULAR]';
    _vistos.add(valor);
    if (Array.isArray(valor))
        return valor.map((v) => redactSecrets(v, _vistos));
    const saida = {};
    for (const [k, v] of Object.entries(valor)) {
        saida[k] = CHAVES_SECRETAS.test(k) && v !== null && v !== undefined && v !== '' ? REDACTED : redactSecrets(v, _vistos);
    }
    return saida;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  redactSecrets, redactText, REDACTED, maskEmail, maskIp, hashIdentifier,
  retentionClassOf, retentionUntil, RETENTION_DAYS, isM2REventInput,
} from '../dist/index.js';

const SEGREDOS = [
  'Bearer abcdefghijklmnop123456',
  'postgres://usuario:SenhaForte123@db.exemplo.com:5432/app',
  'https://site.com/redefinir?token=tok_SEGREDO_abc&x=1',
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.c2lnbmF0dXJhLWZha2U',
  'sk_live_abcdefghijklmnop',
  'sk-proj-abcdefghijklmnopqrstu',
  're_abcdefghijklmnopqrstuv',
  'EAASRw' + 'x'.repeat(60),
  'APP_USR-1234567890-abcdef-ghijklmnop',
  'ghp_' + 'a'.repeat(36),
  'AKIA' + 'ABCDEFGHIJKLMNOP',
];

test('redactText remove segredos conhecidos de texto livre', () => {
  for (const s of SEGREDOS) {
    const r = redactText(`erro ao chamar: ${s} fim`);
    assert.ok(r.includes(REDACTED), `não redigiu: ${s}`);
    assert.ok(!r.includes('SenhaForte123') && !r.includes('tok_SEGREDO_abc') && !r.includes('abcdefghijklmnop123456'));
  }
});

test('redactSecrets troca o valor de chaves com nome de segredo, em qualquer profundidade', () => {
  const entrada = {
    email: 'a@b.com',
    senha: '123456',
    password: 'x',
    nested: { apiKey: 'k', Authorization: 'Bearer zzz', accessToken: 't', lista: [{ client_secret: 's' }] },
    DATABASE_URL: 'mysql://root:pw@host/db',
    preco: 59.9,
    vazio: '',
  };
  const r = redactSecrets(entrada);
  assert.equal(r.senha, REDACTED);
  assert.equal(r.password, REDACTED);
  assert.equal(r.nested.apiKey, REDACTED);
  assert.equal(r.nested.Authorization, REDACTED);
  assert.equal(r.nested.accessToken, REDACTED);
  assert.equal(r.nested.lista[0].client_secret, REDACTED);
  assert.equal(r.DATABASE_URL, REDACTED);
  assert.equal(r.preco, 59.9);
  assert.equal(r.vazio, '');
  assert.equal(entrada.senha, '123456', 'não pode alterar o objeto original');
  const json = JSON.stringify(r);
  for (const proibido of ['123456', 'Bearer zzz', 'root:pw']) assert.ok(!json.includes(proibido), proibido);
});

test('redactSecrets aguenta ciclos e tipos não-objeto', () => {
  const a = { nome: 'x' }; a.self = a;
  assert.equal(redactSecrets(a).self, '[CIRCULAR]');
  assert.equal(redactSecrets(null), null);
  assert.equal(redactSecrets(42), 42);
});

test('mascaramento de e-mail e IP', () => {
  assert.equal(maskEmail('marcos@gmail.com'), 'm***@g***.com');
  assert.equal(maskEmail('nada'), '***');
  assert.equal(maskIp('189.40.12.77'), '189.40.12.0');
  assert.equal(maskIp('::ffff:10.1.2.3'), '10.1.2.0');
  assert.equal(maskIp('2804:14c:65a1:4000::1'), '2804:14c:65a1::');
  assert.equal(maskIp(''), null);
  assert.equal(hashIdentifier(' A@B.com '), hashIdentifier('a@b.com'));
  assert.equal(hashIdentifier('a@b.com').length, 64);
});

test('retenção: acesso 6 meses, comercial 5 anos', () => {
  assert.equal(retentionClassOf('auth_login_failed'), 'acesso');
  assert.equal(retentionClassOf('admin_change', { acao: 'preco_alterado' }), 'comercial');
  assert.equal(retentionClassOf('admin_change', { acao: 'plano_alterado' }), 'comercial');
  assert.equal(retentionClassOf('admin_change', { acao: 'permissao_alterada' }), 'acesso');
  assert.equal(retentionClassOf('lead_found'), 'negocio');
  const base = new Date('2026-10-02T00:00:00Z');
  const dias = (d) => Math.round((d - base) / 86400000);
  assert.equal(dias(retentionUntil('auth_login_succeeded', undefined, base)), RETENTION_DAYS.acesso);
  assert.equal(dias(retentionUntil('admin_change', { acao: 'trial_estendido' }, base)), RETENTION_DAYS.comercial);
});

test('validador aceita eventos de auditoria, de mídia e todos os produtos do tipo', () => {
  for (const type of ['auth_login_failed', 'admin_change', 'media_published']) {
    assert.ok(isM2REventInput({ type, product: 'jack_chicken', actorType: 'user', payload: {} }), type);
  }
  assert.ok(isM2REventInput({ type: 'admin_change', product: 'm2rplace', actorType: 'system', payload: {} }));
  assert.ok(!isM2REventInput({ type: 'inventado', product: 'm2rmenu', actorType: 'user', payload: {} }));
});

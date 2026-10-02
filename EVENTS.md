# EVENTS.md — Schema de Eventos M2RPrime

**Última atualização: 02/10/2026 (v0.4.0, branch `feat/auditoria-v0.4.0`, sem merge)**

> Fonte única de verdade do formato de eventos entre produtos M2RPrime.
> Os tipos TypeScript em `src/types.ts` são a implementação; este arquivo é a referência de uso.

## 1. Contexto

Cada produto M2RPrime (Backfindr, M2RLeads, M2RMenu, M2RFood, M2RAds, M2RPlace, Jack Chicken)
é um repositório independente — não existe monorepo. Este pacote (`m2r-events`) padroniza o **formato** dos
eventos que cada produto emite, para que uma futura camada central (provisoriamente chamada
**M2R Intelligence**) consiga consumi-los de forma consistente quando existir.

**Importante:** não existe (ainda) um coletor central de eventos. Cada produto grava os
eventos na **própria tabela** `events` do seu banco, no formato deste pacote. Nada muda em
termos de infraestrutura hoje — só o formato fica padronizado desde já.

## 2. Instalação

Como não há registry privado configurado, os produtos consomem via dependência git direta:

```json
"dependencies": {
  "m2r-events": "github:reencontra-tudo/m2r-events"
}
```

## 3. Envelope do evento

```ts
interface M2REvent {
  id: string;                 // UUID
  type: M2REventType;         // ver tabela abaixo
  product: M2RProduct;        // 'backfindr' | 'm2rleads' | 'm2rmenu' | 'm2rfood' | 'm2rads' | 'm2rplace' | 'jack_chicken'
  timestamp: string;          // ISO 8601
  entityType?: string;        // 'campaign' | 'lead' | 'user' | ...
  entityId?: string;
  actorType: 'user' | 'system' | 'bot';
  actorId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

## 4. Tipos de evento

| Tipo | Produto emissor | Quando dispara | Payload esperado |
|---|---|---|---|
| `lead_found` | M2RLeads | Novo lead importado/encontrado (planilha ou busca Maps) | `{ leadId, origem, score }` |
| `lead_scored` | M2RLeads | Score calculado/recalculado pra um lead | `{ leadId, score, criterios }` |
| `message_generated` | M2RLeads, M2RAds | Mensagem de contato ou anúncio gerado (hoje regra determinística, futuramente M2R Intelligence) | `{ entityId, canal, texto }` |
| `campaign_created` | M2RAds | Campanha criada pelo painel manual | `{ campaignId, campaignName, productId }` |
| `campaign_paused` | M2RAds | Campanha pausada (manual ou pelo bot) | `{ campaignId, motivo }` |
| `campaign_action_proposed` | M2RAds | Bot decidiu uma ação mas ela está pendente de aprovação manual | `{ campaignId, actionType, reason, beforeValue, afterValue }` |
| `campaign_action_applied` | M2RAds | Ação aplicada de verdade (auto ou aprovada manualmente) | `{ campaignId, actionType, reason, beforeValue, afterValue, mode }` |
| `ad_metrics_synced` | M2RAds | Sincronização periódica de métricas (impressões/cliques) — agregado, não evento por clique individual | `{ campaignId, impressions, clicks, period }` |
| `media_generated` | m2r-media | Asset de mídia criado (IA ou upload manual), status inicial `generated` | `{ mediaAssetId, productSlug, personaSlug, category, mediaType, generationSource }` |
| `media_approved` | m2r-media | Curadoria (humana ou automática, quando `requires_approval=false`) aprova o asset | `{ mediaAssetId, approvedBy }` |
| `media_rejected` | m2r-media | Curadoria rejeita o asset | `{ mediaAssetId, rejectedBy, motivo }` |
| `media_published` | m2r-media | Um alvo de publicação (`media_target`) específico é publicado — um evento por alvo, não por asset | `{ mediaAssetId, mediaTargetId, platform, accountRef, externalPostId }` |
| `media_publish_failed` | m2r-media | Publicação falha num alvo | `{ mediaAssetId, mediaTargetId, platform, motivo }` |
| `media_engagement_synced` | m2r-media | Sincronização periódica de métricas de engajamento por alvo — agregado, não evento por interação individual | `{ mediaTargetId, platform, impressions, reach, likes, comments, shares, clicks, periodStart, periodEnd }` |
| `signup` | todos | Novo usuário/cliente cadastrado | `{ userId, email, origem }` |
| `demo_requested` | todos | Pedido de demonstração | `{ contato, produto }` |
| `subscription_started` | todos | Assinatura paga iniciada | `{ userId, plano, valor }` |
| `subscription_cancelled` | todos | Assinatura cancelada | `{ userId, plano, motivo }` |
| `payment_received` | todos | Pagamento confirmado | `{ userId, valor, referencia }` |
| `churn_detected` | todos | Sinal de risco de cancelamento identificado | `{ userId, sinal }` |

## 5. Payloads tipados, validação em runtime e helper de criação (v0.2.0)

Além do envelope genérico da Seção 3, o pacote agora exporta:

- **`M2REventPayloads`** — interface mapeando cada `M2REventType` pro formato exato de payload da tabela acima (ex: `M2REventPayloads['campaign_paused']` é `{ campaignId: string; motivo: string }`). Uso opcional — `M2REvent`/`M2REventInput` continuam genéricos sobre `TPayload` por compatibilidade com quem já consome o pacote (M2RAds hoje usa `Record<string, unknown>` implícito). Quem quiser payload tipado por evento: `M2REvent<M2REventPayloads['campaign_paused']>`. Um guard de tipo em `types.ts` quebra o build do pacote se `M2REventType` e `M2REventPayloads` divergirem (evento adicionado num lugar e esquecido no outro).
- **`isM2REventInput(x)`** / **`assertM2REventInput(x)`** — validação estrutural em runtime do envelope (não do payload — cada produto valida o próprio payload se quiser, usando `M2REventPayloads`). Existe pra quando o evento não passou pelo type-checker do TypeScript: deserializado de JSON, lido de fila, recebido de outro processo. Zero dependências — validação escrita à mão.
- **`createEvent(input)`** — preenche `id` (UUID via `node:crypto` `randomUUID()`) e `timestamp` (ISO 8601) de forma consistente. Uso opcional: produtos que já geram esses campos de outro jeito (M2RAds hoje usa id serial + timestamp do próprio Postgres na tabela local `events`, não segue o UUID/ISO do envelope canônico) não são obrigados a migrar. Existe pra quem quiser o envelope completo desde já, especialmente pensando numa futura camada central que precise correlacionar eventos entre produtos por UUID.

**Nenhuma integração de produto foi feita nesta rodada** — isso é só a formalização da estrutura no pacote, conforme decidido em 05/08/2026. M2RAds continua consumindo só `M2REventType`/`M2REventInput` como antes; adotar os novos exports é decisão futura, produto a produto.

## 6. Nota sobre `ad_metrics_synced` e `media_engagement_synced`

Não existe `ad_clicked` (evento por clique individual) porque a Google Ads API não notifica
cliques em tempo real — só expõe métricas agregadas por período via consulta. O nome reflete
isso: é uma sincronização periódica, não um webhook de clique. Evitar nomear eventos de um jeito
que sugira granularidade/tempo-real que a fonte de dados não tem (ver princípios de
`BACKFINDR_INTELLIGENCE.md` — nunca inventar dados). `media_engagement_synced` segue o mesmo
princípio (renomeado de `media_engagement_recorded` na proposta original) — nenhuma plataforma
de mídia social dá engajamento em tempo real por interação, só agregado por período.

## 8. Auditoria (v0.4.0)

Contrato comum para registro de **login** e **ações de administrador**, aprovado pelo Marcos em 02/10/2026 (Fase 1 do levantamento de logs). Implementação: `src/audit.ts`.

| Tipo | Quando | Payload | Retenção |
|---|---|---|---|
| `auth_login_succeeded` | login aceito | `{ metodo, ipMascarado }` | acesso (6 meses) |
| `auth_login_failed` | login recusado | `{ metodo, motivo, identificadorMascarado, identificadorHash, ipMascarado }` | acesso |
| `auth_password_changed` | troca ou redefinição de senha | `{ metodo: 'troca'\|'redefinicao', ipMascarado }` | acesso |
| `auth_password_reset_requested` | pedido de "esqueci a senha" | `{ identificadorMascarado, identificadorHash, ipMascarado }` | acesso |
| `auth_impersonation_started` | admin entra como outro usuário | `{ alvoId, alvoTipo, ipMascarado }` | acesso |
| `admin_change` | admin muda plano, preço, trial, status, configuração de pagamento… | `{ acao, recurso, recursoId, antes, depois, ipMascarado }` | comercial (5 anos); `permissao_alterada`/`usuario_*` = acesso |

Regras obrigatórias:
1. **Grava primeiro na tabela `events` do próprio produto**, com a coluna de expurgo calculada por `retentionUntil()`. Envio a coletor central é posterior.
2. **Sem dado pessoal em claro:** `maskEmail()` + `hashIdentifier()` para o identificador; `maskIp()` para o IP. O autor é o `actorId` (id interno), nunca nome ou e-mail.
3. **Sem segredo:** todo `payload`/`metadata` passa por `redactSecrets()` antes de gravar (chaves com nome de segredo e padrões como Bearer, JWT, URL com senha, chaves de API). Testado em `test/audit.test.mjs`.
4. **Retenção** (`RETENTION_DAYS`): acesso 183 dias (Marco Civil, art. 15); comercial 1.827 dias (5 anos); negócio 730 dias.
5. **Falha de auditoria nunca derruba o fluxo principal**, mas é registrada no log de erro.

## 7. Log de decisões

### 05/08/2026 — Criação do pacote
Definido junto com o desenho do M2RAds. Formato modelado em cima do `object_events` que o
Backfindr já usa para o "Sistema Vivo" (`src/lib/events.ts`), generalizado com o campo `product`
e tipado neste pacote compartilhado. M2RAds é o primeiro produto a consumir desde o início.

### 05/08/2026 — v0.2.0: formalização (payloads tipados, validação, factory)
Envelope (Seção 3) e tipos de evento (Seção 4) já estavam definidos desde a criação do pacote —
esta rodada formalizou o que faltava: payload tipado por evento (antes só documentado em prosa
na tabela da Seção 4), validação em runtime pra consumidores fora do type-checker do TypeScript,
e geração consistente de `id`/`timestamp`. Tudo aditivo, sem quebrar a API existente — ver Seção 5.

### 05/08/2026 — repositório tornado público
Descoberto durante o primeiro deploy real do M2RAds (Railway): `"m2r-events": "github:..."`
como dependência git de repo **privado** funciona em dev local (ambiente já tem SSH/git
configurado) mas quebra em qualquer build limpo — `npm install` tenta `ssh://git@github.com/...`,
e containers de build (Railway, GitHub Actions, etc.) não têm SSH nem credencial pra dependências
git arbitrárias do `package.json`. Como o pacote não tem nenhum conteúdo sensível (só schema,
tipos, validação — feito pra ser consumido por todo produto M2RPrime sem fricção, que era o
objetivo desde a criação), a correção foi tornar o repositório público em vez de configurar um
token de leitura por produto. Resolve de vez pra qualquer produto que for adicionar essa
dependência no futuro, não só o M2RAds. Detalhe técnico completo em `M2RADS.md`
(achado técnico #8, sessão 3).

### 31/08/2026 — v0.3.0: Central de Mídia (m2r-media) — `m2rplace` + `jack_chicken` como produtos, 6 eventos de mídia

Motivado pela proposta de "Central de Mídia" compartilhada entre produtos M2RPrime (design
completo em `m2rintelligence/docs/media_hub_proposal.md`, aprovado por Marcos em 30/08/2026),
que generaliza o motor n8n do AutoPost do Backfindr (hoje hardcoded pra Facebook/Instagram de
6 nichos) pra publicar mídia de qualquer produto/persona em qualquer plataforma.

- `M2RProduct` ganha `'m2rplace'` (decisão 2 da proposta — motivador original: o vídeo mockado
  do TikTok Shop do M2RPlace precisa de uma fonte real de asset) e `'jack_chicken'` (empresa
  que passa a publicar via o mesmo motor generalizado, NEXT da Central de Mídia).
- 6 tipos de evento novos (`media_generated`, `media_approved`, `media_rejected`,
  `media_published`, `media_publish_failed`, `media_engagement_synced`) — mesmo envelope
  genérico da Seção 3, nenhuma mudança de formato. `product` no envelope é sempre o dono real
  da mídia (`backfindr`, `m2rplace`, `jack_chicken`, ...), nunca um `'media-hub'` fictício
  (decisão 4 da proposta) — proveniência de que foi a Central de Mídia quem emitiu vai em
  `metadata`, não em `product`.
- Nenhuma integração de produto feita nesta rodada — só formalização do pacote, seguindo o
  mesmo padrão do v0.2.0. O primeiro emissor real é o workflow n8n generalizado do Backfindr.

### 02/10/2026 — v0.4.0: auditoria (branch `feat/auditoria-v0.4.0`, sem merge)
- 6 tipos de auditoria (`auth_*`, `admin_change`), retenção por classe, mascaramento e redação de segredos (seção 8).
- **Correção:** o validador (`isM2REventInput`) rejeitava os 6 eventos `media_*` e os produtos `m2rplace`/`jack_chicken` desde a v0.3.0, embora existissem no tipo. Agora aceita.
- Testes com o executor nativo do Node (`npm test`), sem dependência nova.
- Consumidores (jack_chicken_gestao, backfindr) copiam o contrato localmente até o merge, para não depender de um branch não mergeado no build de produção.


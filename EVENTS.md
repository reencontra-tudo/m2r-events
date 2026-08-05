# EVENTS.md — Schema de Eventos M2RPrime

**Última atualização: 05/08/2026 (v0.2.0)**

> Fonte única de verdade do formato de eventos entre produtos M2RPrime.
> Os tipos TypeScript em `src/types.ts` são a implementação; este arquivo é a referência de uso.

## 1. Contexto

Cada produto M2RPrime (Backfindr, M2RLeads, M2RMenu, M2RFood, M2RAds) é um repositório
independente — não existe monorepo. Este pacote (`m2r-events`) padroniza o **formato** dos
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
  product: M2RProduct;        // 'backfindr' | 'm2rleads' | 'm2rmenu' | 'm2rfood' | 'm2rads'
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

## 6. Nota sobre `ad_metrics_synced`

Não existe `ad_clicked` (evento por clique individual) porque a Google Ads API não notifica
cliques em tempo real — só expõe métricas agregadas por período via consulta. O nome reflete
isso: é uma sincronização periódica, não um webhook de clique. Evitar nomear eventos de um jeito
que sugira granularidade/tempo-real que a fonte de dados não tem (ver princípios de
`BACKFINDR_INTELLIGENCE.md` — nunca inventar dados).

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

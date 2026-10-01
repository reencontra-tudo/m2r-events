# STATUS — m2r-events (schema de eventos M2R)
Atualizado: 01/10/2026 07:40
Prioridade no portfólio: A definir (não incluído na decisão de 01/10/2026)
Fase: biblioteca sem deploy; master = v0.3.0 (PR #1 mergeado em 01/10/2026); m2rads fixado em v0.1.0 (493e34c)
Objetivo atual: alinhar os consumidores ao contrato de eventos (m2rads ainda em v0.1.0; m2rintelligence com envelope próprio)
Próximo passo exato: decidir se o m2rads sobe de v0.1.0 (493e34c) para v0.3.0: comparar `src/` de 493e34c com a master atual e listar o que muda nos tipos usados em `server/` do m2rads antes de trocar a ref no package.json
Feito na última sessão:
- 01/10: PR #1 mergeado (merge 2379086): v0.3.0 na master
- 01/10: m2rads fixado no commit que roda em produção (493e34c, v0.1.0, e não v0.2.0 como se supunha), merge 8193476
- 31/08: v0.3.0 no branch `feat/media-hub-events` (produtos `m2rplace` e `jack_chicken`, 6 eventos `media_*`), build validado
Pendências (em ordem de prioridade):
- m2rads depende de `github:reencontra-tudo/m2r-events` sem ref: o merge do PR #1 muda a versão no próximo build do m2rads
- PR #1 aberto desde 31/08 (o m2r-media já emite eventos no formato v0.3.0)
- m2rintelligence usa outro envelope de evento, sem adaptador
Bloqueios / dependências externas:
- Merge do PR #1 é ação do Marcos
Decisões recentes (com data):
- 01/10/2026: prioridade no portfólio = A definir (definida por Marcos)
- 25/09/2026: cofre de segredos implantado (`~/bin/cofre`)
- 16/09/2026: cada produto grava eventos na própria tabela `events` (sem coletor central, EVENTS.md §1)
- 30/08/2026: campo `product` = dono real da mídia; evento `media_engagement_synced`

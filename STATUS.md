# STATUS — m2r-events (schema de eventos M2R)
Atualizado: 25/09/2026 20:00 (geração inicial, sessão autônoma)
Prioridade no portfólio: A definir
Fase: biblioteca sem deploy; v0.2.0 (`master`) em uso pelo m2rads; v0.3.0 no PR #1
Objetivo atual: publicar a v0.3.0 (eventos da Central de Mídia) sem mudar sem querer a dependência do m2rads em produção
Próximo passo exato: criar a tag `v0.2.0` no commit `7a13d84` e trocar no `package.json` do m2rads a dependência para `github:reencontra-tudo/m2r-events#v0.2.0`; só então Marcos decide o merge do PR #1 (https://github.com/reencontra-tudo/m2r-events/pull/1)
Feito na última sessão:
- 31/08: v0.3.0 no branch `feat/media-hub-events` (produtos `m2rplace` e `jack_chicken`, 6 eventos `media_*`), build validado
Pendências (em ordem de prioridade):
- m2rads depende de `github:reencontra-tudo/m2r-events` sem ref: o merge do PR #1 muda a versão no próximo build do m2rads
- PR #1 aberto desde 31/08 (o m2r-media já emite eventos no formato v0.3.0)
- m2rintelligence usa outro envelope de evento, sem adaptador
Bloqueios / dependências externas:
- Merge do PR #1 é ação do Marcos
Decisões recentes (com data):
- 25/09/2026: cofre de segredos implantado (`~/bin/cofre`)
- 16/09/2026: cada produto grava eventos na própria tabela `events` (sem coletor central, EVENTS.md §1)
- 30/08/2026: campo `product` = dono real da mídia; evento `media_engagement_synced`

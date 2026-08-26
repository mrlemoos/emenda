# Issue tracker: Markdown local

Specs e issues deste projeto vivem em `.scratch/`.

## Convenções

- Uma pasta por funcionalidade: `.scratch/<slug>/`.
- A spec fica em `.scratch/<slug>/spec.md`.
- Issues de implementação ficam em `.scratch/<slug>/issues/<NN>-<slug>.md`, uma por ficheiro e numeradas a partir de `01`.
- O estado aparece numa linha `Status:` perto do topo, conforme `triage-labels.md`.
- Comentários são anexados ao fim do ficheiro sob `## Comments`.

Quando uma skill pedir para publicar no tracker, ela cria o ficheiro correspondente em `.scratch/`.

Quando uma skill pedir um ticket, ela lê o caminho ou número informado pelo utilizador.

## Wayfinding

- Mapa: `.scratch/<trabalho>/map.md`.
- Ticket filho: `.scratch/<trabalho>/issues/<NN>-<slug>.md`.
- `Type:` aceita `research`, `prototype`, `grilling` ou `task`.
- `Status:` aceita `claimed` ou `resolved` durante a execução.
- `Blocked by:` lista os números dos tickets bloqueadores.
- O próximo ticket é o primeiro aberto, desbloqueado e não reivindicado.
- Reivindicar muda o estado para `claimed` antes do trabalho.
- Resolver adiciona `## Answer`, muda o estado para `resolved` e regista a decisão no mapa.

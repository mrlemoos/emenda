# Emenda

Veja para onde foi o dinheiro das emendas parlamentares.

![Homepage do Emenda](public/homepage.png)

O Emenda reúne transferências federais, quem recebeu e gastos públicos que conseguimos relacionar a essas transferências. Dados oficiais e inferências não são a mesma coisa aqui.

## Como lemos os dados

- **Dinheiro enviado** é valor efetivamente pago. Não confundimos autorização ou empenho com pagamento.
- **Vínculo confirmado** aparece quando uma fonte oficial declara relação entre emenda e gasto.
- **Vínculo provável** é inferência explicada por indícios públicos. Nunca passa por confirmação.
- **Sem comprovação encontrada** diz apenas que fontes consultadas não sustentam gasto. Não prova inexistência.

Consulte [metodologia e cobertura](https://github.com/mrlemoos/emenda/blob/main/src/app/metodologia/page.tsx) para fontes, território e limites atuais.

## Fontes e cobertura

Transferências federais vêm do Transferegov. Gastos municipais detalhados estão em piloto para Florianópolis e São Paulo capital. O mapa nacional mostra transferências. Cobertura de gasto municipal cresce cidade por cidade, sem fingir que Brasil inteiro tem mesma qualidade de dados.

## Rodar localmente

Requer Node.js 24+, pnpm 11 e `DATABASE_URL` em `.env.local`.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Abra [localhost:3000](http://localhost:3000). Para carregar dados, rode `pnpm sync`.

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## Contribuir

Abra uma [issue](https://github.com/mrlemoos/emenda/issues) com fonte, link público e contexto. Erro de dado precisa apontar para documento público que permita revisão.

## Apoie

- [GitHub](https://github.com/mrlemoos)
- [Buy Me a Coffee](https://buymeacoffee.com/leolemos)

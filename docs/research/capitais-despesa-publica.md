# Capitais com dados públicos de despesa aproveitáveis pelo Emenda

Pesquisa verificada em 26 de agosto de 2026. Critério: acesso sem convênio, dados por fornecedor e rastreio das fases de empenho, liquidação e pagamento. Fonte de recurso e identificadores que permitam ligar as fases contam como vantagem.

## Resultado

| Capital | Nota | Acesso | Fornecedor | Empenho, liquidação e pagamento | Fonte | Veredito |
| --- | --- | --- | --- | --- | --- | --- |
| Belo Horizonte | A | CKAN, CSV e API do datastore | Nome e documento | Sim, inclusive números e datas na base consolidada | Sim na base anual | Melhor piloto |
| Recife | A- | CKAN, CSV e API do datastore | Nome e CPF/CNPJ | Sim, com datas e valores | Não aparece no recurso por credor verificado | Bom segundo conector |
| Curitiba | B | CSV aberto | CPF/CNPJ mascarado; nome não aparece na base verificada | Número de empenho e valores das três fases | Sim | Útil, mas identificação do fornecedor precisa de complemento |
| Fortaleza | B- | Portal público consultável | Nome e CNPJ | Sim, com parcelas, datas e notas fiscais | Sim | Excelente para apuração humana; ruim para ingestão automática |
| Porto Alegre | C | CKAN, CSV e API em parte do histórico | Não | Só totais mensais das três fases | Não na base de despesas | Insuficiente para o Emenda |
| Salvador | C | Portal público com consulta | CPF/CNPJ e nome por filtro | Sim | Sim | Consultável, mas não encontrei download ou API oficial reutilizável |

## Belo Horizonte

A [base Despesas Orçamentárias](https://dados.pbh.gov.br/dataset/despesas-orcamentarias) publica CSV por exercício, de 2020 a 2026. O recurso de 2026 tem datastore ativo, download sem autenticação e campos de credor, documento, empenhado, liquidado, pago, fonte detalhada e até número e exercício da emenda. A licença informada é Creative Commons Attribution. O arquivo de 2026 tinha 85,4 MiB na consulta.

A [Despesa Consolidada em Tempo Real](https://dados.pbh.gov.br/dataset/despesa-consolidada-em-tempo-real/resource/2778461f-ff1c-49f0-ba58-731169122b7d) acrescenta número e data de empenho, liquidação e ordem de pagamento, além de credor e documento. A combinação das duas bases cobre praticamente o modelo do Emenda. Falta validar a chave exata de junção e o tratamento de anulações antes de somar valores.

Recomendação: começar por BH. Baixar os CSVs anuais para carga inicial e usar a API CKAN ou o arquivo corrente para atualização. Guardar a licença e a data de extração em cada linha.

## Recife

O [conjunto Despesas Orçamentárias](https://dados.recife.pe.gov.br/pt_BR/dataset/despesas-orcamentarias) oferece CSV e datastore CKAN. Há histórico no formato antigo de 2019 a 2023 e recursos por credor para 2024, 2025 e 2026. A frequência declarada é mensal.

O [recurso por credor de 2026](https://dados.recife.pe.gov.br/dataset/despesas-orcamentarias/resource/a59516cb-a2db-4859-a173-d04e8ab738b9) informa CPF/CNPJ, nome do credor, datas de empenho e pagamento, valores empenhado, liquidado e pago, anulações, órgão e modalidade. A licença é ODbL. O esquema verificado não mostra fonte de recurso nem número do empenho, apesar do nome do recurso. O Portal da Transparência oferece [consulta pública por credor e empenho](https://transparencia.emprel.gov.br/codigos/web/despesas/despesaDetalhadaCredor.php), com filtro por fonte, mas essa página não substitui um campo ausente no CSV.

Recomendação: conector viável. Primeiro testar se o CSV real contém identificador de empenho não mostrado no catálogo. Sem ele, publicar os valores por credor, órgão e período como agregado, não como vínculo confirmado a uma despesa individual.

## Curitiba

A [Base de receitas e despesas](https://dadosabertos.curitiba.pr.gov.br/conjuntodado/detalhe/?chave=5ddffbe8-313b-4d94-a862-73ab74b3817c) é um download CSV atualizado. A base traz número e data do empenho, fonte, classificação orçamentária, licitação, data da transação e valores liquidado e pago. Isso basta para acompanhar as fases e separar fontes.

O problema está no credor. O esquema público mostra `CPF_CNPJ`, com documentos mascarados nos exemplos, mas não mostra nome do fornecedor. A [base de contratações da COVID-19](https://dadosabertos.curitiba.pr.gov.br/conjuntodado/detalhe?chave=0f088a07-ea01-4639-93e8-7a22c05e94c6) prova que a Prefeitura consegue publicar nome, CNPJ, empenho, valores e fonte juntos, porém cobre apenas esse recorte.

Recomendação: usar depois de confirmar uma base pública complementar de fornecedores ou contratos que se ligue ao empenho. Não tentar reidentificar CPF mascarado.

## Fortaleza

O [Portal da Transparência](https://transparencia.fortaleza.ce.gov.br/index.php/sobrePortal) declara consulta por fornecedor e pelas fases de empenho, liquidação e pagamento. A página de um [empenho detalhado](https://transparencia.fortaleza.ce.gov.br/index.php/despesa/visualizarEmpenho/P/2021/72/1244/0/MDI2MjYzNDAwMDAxNTg%3D/0/0) mostra credor, descrição, fonte, parcelas, datas de liquidação e pagamento, processo, ordem de crédito e uma coluna de notas fiscais. É a melhor interface pública entre as seis capitais para conferir documentos fiscais ligados ao gasto.

O [Portal de Dados Abertos](https://dados.fortaleza.ce.gov.br/) publica balancetes, e a documentação confirma valores empenhados, liquidados e pagos. Não encontrei, porém, um recurso aberto que preserve no mesmo registro o fornecedor, o empenho, os pagamentos e as notas mostradas na interface.

Recomendação: usar o portal para investigação e validação manual. Só automatizar se a Prefeitura documentar API ou download estável. Raspagem de páginas não é uma base segura para o produto.

## Porto Alegre

O CKAN municipal publica a base [Despesas](https://dadosabertos.poa.br/dataset/despesas) em CSV, com recursos anuais de 2018 a 2026 e licença CC BY. Alguns anos oferecem API do datastore. O [dicionário oficial](https://dadosabertos.poa.br/dataset/b5eac908-416d-42f0-9fb6-432f1b717ff1/resource/43c55314-56d9-4bb6-8ff2-13d011e90262/download/dd-despesas.pdf) mostra órgão, mês, classificação e valores empenhado, liquidado e pago.

A base é agregada. Não contém credor, CPF/CNPJ, número do empenho, número de liquidação, pagamento nem fonte. Portanto, não responde quem recebeu nem permite ligar gasto a uma emenda específica.

Recomendação: não criar conector agora. Serve para conferência de totais, não para o fluxo principal do Emenda.

## Salvador

O [Portal da Transparência](https://transparencia.salvador.ba.gov.br/) permite consulta pública. O [manual oficial](https://antigotransparencia.salvador.ba.gov.br/documentacao/Manual/MANUAL%20DE%20NAVEGA%C3%87%C3%83O.pdf) documenta filtros por fase, período, CPF/CNPJ, favorecido, órgão, ação e fonte. Os resultados incluem empenho, favorecido, classificação e valores.

Não encontrei no portal oficial um catálogo CKAN, API documentada ou download aberto por registro. A aplicação atual depende de JavaScript. Relatórios contábeis agregados não resolvem o requisito do Emenda.

Recomendação: manter Salvador como fonte consultável, não como conector. Um pedido LAI pode perguntar pela exportação usada pelo próprio portal, mas isso já seria outra etapa e não é acesso garantido sem coordenação.

## Ordem recomendada

1. Belo Horizonte, porque já publica credor, fonte, emenda e as três fases em arquivos reutilizáveis.
2. Recife, depois de verificar o identificador de empenho no CSV real.
3. Curitiba, se contratos ou cadastro público completarem o nome do fornecedor.
4. Fortaleza apenas como validação manual, especialmente para notas fiscais.

Porto Alegre e Salvador não justificam conector no MVP. O primeiro agrega demais. O segundo expõe a consulta, mas não uma base reutilizável.

Nenhuma dessas bases prova sozinha que uma despesa foi paga com determinada emenda federal. O vínculo deve usar fonte, identificador de transferência, dotação, empenho e, quando houver, número da emenda. Na ausência desses campos, o Emenda deve marcar o vínculo como provável e explicar o critério.

# Comprovações fiscais de Florianópolis

Status: ready-for-human

## Problem Statement

O Emenda mostra dinheiro enviado a recebedores, mas ainda não consegue mostrar como esses recursos foram gastos. Notas fiscais poderiam sustentar um gasto, porém não existe uma API pública que permita enumerar todas as NF-e e NFS-e recebidas por um município.

NF-e de mercadorias e NFS-e de serviços seguem sistemas e regras de acesso diferentes. Consultas públicas verificam documentos conhecidos pela chave. Distribuição em lote exige que o município participe ou autorize o acesso. Em Florianópolis, as NFS-e posteriores a 1 de dezembro de 2025 estão no Sistema Nacional NFS-e, enquanto o histórico anterior permanece no sistema municipal antigo.

Sem uma ingestão autorizada, o Emenda não deve afirmar que encontrou todos os gastos. Sem ligar nota, liquidação, pagamento e origem do recurso, uma nota isolada também não comprova que o gasto corresponde a uma emenda.

## Solution

Criar a primeira cobertura detalhada de gastos para Florianópolis. A ingestão recebe documentos fiscais e dados de execução orçamentária fornecidos ou autorizados pelo município. O sistema normaliza esses dados como gastos, encontra vínculos confirmados ou prováveis com emendas e publica somente os campos necessários para a comprovação.

Os portais nacionais serão usados para verificar documentos cuja chave já é conhecida. Eles não serão usados para descobrir notas em massa. Para NFS-e emitidas desde dezembro de 2025, o caminho preferido é um feed autorizado pelo Ambiente de Dados Nacional. Para o histórico municipal, o caminho preferido é uma exportação única, sem manter uma integração permanente com o emissor descontinuado.

A página pública deve deixar clara a cobertura, a fonte de cada gasto e o motivo de cada vínculo provável. XML bruto, credenciais fiscais e dados pessoais desnecessários não serão publicados.

## User Stories

1. Como cidadão, quero ver os gastos correspondentes a uma emenda recebida por Florianópolis, para entender como o dinheiro foi usado.
2. Como cidadão, quero distinguir dinheiro enviado de gasto, para não confundir transferência federal com execução municipal.
3. Como cidadão, quero abrir a comprovação de um gasto, para conferir a origem da informação.
4. Como cidadão, quero saber se a comprovação é uma NF-e, NFS-e ou outro documento, para entender o que estou consultando.
5. Como cidadão, quero ver fornecedor, descrição, data e valor do gasto, para compreender a compra ou o serviço contratado.
6. Como cidadão, quero saber se o vínculo com a emenda é confirmado ou provável, para avaliar o grau de certeza.
7. Como cidadão, quero ler os motivos de um vínculo provável, para poder concordar ou contestar a inferência.
8. Como cidadão, quero saber quando nenhuma comprovação foi encontrada, para não interpretar ausência de dados como ausência de gasto.
9. Como cidadão, quero ver o período coberto em Florianópolis, para saber quais conclusões os dados permitem.
10. Como cidadão, quero distinguir a cobertura do emissor nacional da cobertura do sistema municipal antigo, para entender lacunas históricas.
11. Como cidadão, quero acessar a fonte pública original quando ela existir, para verificar o documento fora do Emenda.
12. Como cidadão, quero pesquisar gastos pelo nome do fornecedor, para localizar quem recebeu dinheiro público.
13. Como cidadão, quero pesquisar gastos por recebedor, emenda e período, para reduzir o conjunto de resultados.
14. Como cidadão, quero baixar os gastos e seus vínculos em CSV, para fazer minha própria análise.
15. Como jornalista, quero identificar a chave fiscal quando sua publicação for permitida, para cruzar o documento com outras bases.
16. Como jornalista, quero conhecer a data da última atualização da fonte municipal, para avaliar a atualidade da matéria.
17. Como jornalista, quero que revisões de um vínculo preservem a explicação anterior, para auditar mudanças editoriais.
18. Como pesquisador, quero identificadores estáveis para gastos e comprovações, para repetir análises sem duplicar registos.
19. Como pesquisador, quero valores nominais conforme a fonte, para não misturar correção monetária com o documento fiscal.
20. Como pesquisador, quero que cancelamentos e eventos fiscais apareçam no estado da comprovação, para não tratar uma nota cancelada como gasto válido.
21. Como recebedor parceiro, quero enviar apenas documentos ligados aos meus órgãos e entidades, para limitar o acesso ao escopo autorizado.
22. Como recebedor parceiro, quero que reprocessamentos sejam idempotentes, para corrigir ou repetir uma entrega sem criar duplicados.
23. Como recebedor parceiro, quero consultar rejeições da importação com motivos objetivos, para corrigir os dados de origem.
24. Como recebedor parceiro, quero fornecer uma exportação única do sistema antigo, para não manter uma integração com software descontinuado.
25. Como operador do Emenda, quero retomar a distribuição fiscal a partir do último NSU persistido, para não perder nem baixar documentos repetidos.
26. Como operador do Emenda, quero separar credenciais por recebedor e ambiente, para impedir que uma integração acesse outra.
27. Como operador do Emenda, quero registrar início, fim, volume e erro de cada sincronização, para diagnosticar falhas.
28. Como operador do Emenda, quero reprocessar um lote normalizado sem consultar novamente a fonte, para corrigir regras de vínculo com baixo custo.
29. Como operador do Emenda, quero ocultar CPF, endereço, telefone e e-mail antes da persistência pública, para reduzir exposição de dados pessoais.
30. Como operador do Emenda, quero impedir a publicação automática de XML bruto, para respeitar sigilo fiscal e minimização de dados.
31. Como operador do Emenda, quero revisar manualmente casos ambíguos, para não publicar uma inferência fraca como vínculo provável.
32. Como mantenedor, quero adicionar outro município por meio do mesmo formato normalizado, para reutilizar a ingestão sem fingir que o acesso fiscal é universal.
33. Como mantenedor, quero declarar a cobertura de cada conector, para que novas fontes não ampliem silenciosamente as alegações do produto.
34. Como mantenedor, quero testar uma entrega completa até a API pública, para detectar regressões no caminho que o cidadão usa.
35. Como encarregado de dados, quero saber quais campos vieram da nota e quais vieram do processo de despesa, para aplicar as regras jurídicas corretas.
36. Como encarregado de dados, quero bloquear documentos fora do escopo autorizado antes da publicação, para evitar divulgação indevida.

## Implementation Decisions

- A descoberta começa nas bases de execução orçamentária e nos feeds autorizados do recebedor. Consulta pública por chave é verificação, não mecanismo de indexação.
- O primeiro recebedor detalhado será Florianópolis.
- NF-e modelo 55, NFS-e nacional e NFS-e municipal antiga serão normalizadas para o mesmo conceito de comprovação, preservando tipo, identificador de origem, chave, estado, fonte e data de atualização.
- O gasto continuará sendo a unidade pública de execução. Uma comprovação pode sustentar um gasto, mas não substitui os dados de empenho, liquidação e pagamento.
- O modelo de gasto ganhará os identificadores de liquidação e pagamento necessários ao rastreio, além do estado da comprovação e do tipo do documento fiscal.
- O vínculo confirmado exige uma relação declarada por fonte oficial entre a emenda e o gasto.
- O vínculo provável exige motivos legíveis baseados em campos normalizados. Não haverá percentagem ou pontuação opaca.
- Uma nota isolada, sem cadeia até a origem do recurso, não cria vínculo confirmado.
- A importação aceitará entregas repetidas e atualizará registos pela identidade estável da fonte.
- A distribuição incremental por NSU persistirá o último cursor confirmado somente depois da gravação bem-sucedida do lote.
- Credenciais e certificados ficarão fora do banco público e fora dos artefactos de deploy. Cada recebedor terá autorização própria.
- O sistema rejeitará documentos cujo destinatário ou tomador não pertença ao escopo autorizado.
- O normalizador descartará CPF, endereço, telefone, e-mail e campos fiscais sem uso público antes de gravar dados publicáveis.
- XML e payload original poderão existir apenas em armazenamento restrito se revisão jurídica e operação exigirem. O produto público nunca os entrega.
- A API e o CSV públicos exporão o recorte necessário: fornecedor, documento do fornecedor quando permitido, descrição, data, valor, tipo de comprovação, estado, fonte, vínculo e motivos.
- A cobertura registrará fonte, recebedor, primeiro e último período disponível, última sincronização e lacunas conhecidas.
- NFS-e de Florianópolis desde 1 de dezembro de 2025 usará preferencialmente o feed autorizado do Ambiente de Dados Nacional.
- O histórico anterior usará uma exportação única do sistema municipal. Não será criado um conector permanente sem necessidade comprovada.
- O cron mensal existente continuará responsável pelas fontes federais. A fonte fiscal terá sincronização própria, definida conforme limites e frequência do acordo com o município.
- Falhas parciais não avançarão o cursor da fonte nem removerão gastos publicados por uma execução anterior.
- O lançamento depende de acordo de acesso com Florianópolis e revisão jurídica dos campos publicáveis.

## Testing Decisions

- Haverá um teste principal no ponto mais alto possível: uma entrega autorizada de Florianópolis entra pela ingestão, passa pela normalização e pelo vínculo, e aparece na resposta pública com cobertura e motivos corretos.
- O mesmo teste verificará que uma reentrega não duplica gastos, que um documento fora do destinatário autorizado é rejeitado e que dados pessoais e XML bruto não aparecem na saída.
- O teste usará amostras sintéticas representando NF-e, NFS-e nacional e uma NFS-e municipal antiga. Ele não dependerá dos portais fiscais nem de certificados reais.
- O comportamento externo será testado. Estrutura interna, chamadas entre funções e detalhes do ORM não serão afirmados nos testes.
- O teste existente de agregação de valores é referência para lógica financeira pequena, mas não substitui o teste completo de ingestão e publicação.
- Consultas reais ao ADN ou à distribuição de NF-e ficarão em uma verificação operacional separada, executada somente com credenciais autorizadas.

## Out of Scope

- Enumerar todas as notas fiscais brasileiras sem autorização dos destinatários ou tomadores.
- Burlar CAPTCHA, limites de consulta, certificado digital ou regras de distribuição fiscal.
- Cobrir todos os municípios nesta primeira entrega.
- Manter um conector permanente para o emissor antigo de Florianópolis.
- Publicar XML fiscal bruto ou campos pessoais desnecessários.
- Considerar uma nota fiscal, sozinha, como prova de origem parlamentar do recurso.
- Automatizar decisões jurídicas sobre sigilo fiscal, LAI ou LGPD.
- Corrigir valores pelo IPCA nesta ingestão.
- Substituir os portais oficiais de autenticidade fiscal.

## Further Notes

- A pesquisa que fundamenta esta spec foi verificada em 25 de agosto de 2026 e está em `docs/research/nfe-sefaz.md`.
- NF-e de mercadorias usa o Ambiente Nacional da NF-e e distribuição restrita aos atores autorizados do documento.
- NFS-e de serviços pertence à administração tributária municipal. O Sistema Nacional NFS-e centraliza documentos compartilhados, mas não oferece catálogo público irrestrito.
- A adesão atual de um município ao padrão nacional não garante que seu histórico foi transcrito para o Ambiente de Dados Nacional.
- A cobertura pública deve usar "sem comprovação encontrada" quando a consulta não retornar documento, conforme o glossário do Emenda.

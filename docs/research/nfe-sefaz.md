# Dá para consultar notas pela Fazenda?

Pesquisa verificada em 25 de agosto de 2026, usando documentação oficial.

## Conclusão

Não existe uma API pública da Secretaria da Fazenda que entregue todas as NF-e e NFS-e de todos os municípios. Há três trilhas diferentes:

| Documento | Quem administra | O que um site público consegue fazer |
| --- | --- | --- |
| NF-e, modelo 55, para mercadorias | SEFAZ e Ambiente Nacional da NF-e | Consultar uma nota conhecida pela chave de 44 dígitos. A consulta pública tem CAPTCHA e não é uma API de indexação. A distribuição em lote exige certificado e só entrega documentos ligados ao CNPJ/CPF autenticado. |
| NFS-e municipal antiga | Cada município | Depende do sistema local. Não há um serviço estadual que reúna essas notas. |
| NFS-e de padrão nacional | Sistema Nacional NFS-e, da Receita Federal e municípios conveniados | Consulta pública de nota conhecida pela chave. Distribuição em lote existe para municípios conveniados e partes autorizadas, não como base pública irrestrita. |

Para o Emenda, o caminho viável é uma parceria com cada ente comprador, não uma raspagem geral da Fazenda. O município pode fornecer as notas que recebeu, ou autorizar uma integração executada em seu nome. O site publica apenas os campos necessários para comprovar o gasto, com tratamento jurídico e técnico para sigilo fiscal e dados pessoais.

## NF-e de mercadorias

A NF-e de mercadorias não é a nota de serviço municipal. O Portal Nacional permite [consulta por chave de acesso](https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa), mas exige os 44 dígitos e usa CAPTCHA para impedir consultas automatizadas. Portanto, essa tela serve para conferir uma nota cuja chave já apareceu num processo de compra, empenho ou pagamento. Ela não serve para descobrir e baixar todas as notas de uma prefeitura.

O serviço `NFeDistribuicaoDFe` resolve outro caso. A [Nota Técnica 2014.002](https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=0rPhVp1wRqc%3D) diz que a distribuição atende os atores indicados na NF-e: emitente, destinatário, transportador e pessoas autorizadas no campo `autXML`. O cliente usa certificado digital ICP-Brasil. Para pessoa jurídica, o CNPJ-base do certificado precisa corresponder ao CNPJ consultado. A distribuição incremental usa NSU e não é uma busca aberta por órgão, fornecedor ou período.

Isso produz duas opções reais para compras municipais:

1. A prefeitura, como destinatária, recupera suas NF-e e entrega ao Emenda um recorte autorizado.
2. A prefeitura inclui um operador autorizado na NF-e ou formaliza uma integração que use suas credenciais sob sua governança.

O Emenda, sozinho, não pode apresentar seu próprio certificado e pedir todas as NF-e emitidas contra qualquer município. A documentação também impõe regras contra uso indevido. O Portal chegou a [suspender consultas pontuais por NSU e chave em 2022](https://www.nfe.fazenda.gov.br/portal/informe.aspx?AspxAutoDetectCookieSupport=1&Informe=A6qvFRVbPSA%3D&ehCTG=false) por excesso de uso indevido, mantendo a distribuição sequencial. A integração deve consumir NSUs continuamente e respeitar os limites publicados na versão vigente da nota técnica.

## NFS-e municipal e padrão nacional

ISS é administrado pelo município. Por isso, historicamente, cada prefeitura escolheu seu emissor e sua API de NFS-e. A SEFAZ estadual não substitui esses sistemas nem oferece uma base nacional das notas municipais antigas.

O Sistema Nacional NFS-e muda parte desse cenário. O [portal oficial](https://www.gov.br/nfse/pt-br) mantém um Ambiente de Dados Nacional, o ADN. A [consulta pública](https://www.nfse.gov.br/consultapublica/) aceita uma chave de acesso ou os dados da DPS. O próprio [serviço no gov.br](https://www.gov.br/pt-br/servicos/consultar-nota-fiscal-de-servico-eletronica) descreve a consulta de terceiros como verificação de autenticidade com chave. Ele reserva a integração de alto volume a municípios e empresas nos papéis previstos pelo sistema.

O [manual das APIs do ADN para municípios conveniados](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual/manual-municipios-apis-adn-sistema-nacional-nfs-e-v1-2-out21025.pdf/@@download/file) documenta:

- consulta de NFS-e por chave;
- distribuição incremental de DF-e por NSU;
- consulta pontual por NSU;
- geração de DANFSe por chave;
- autenticação e verificação de que o certificado representa um ator da nota em consultas protegidas por sigilo fiscal.

O mesmo manual destina essas APIs aos municípios conveniados. Ele não documenta um catálogo público que permita a um terceiro enumerar todas as NFS-e. Ter uma chave possibilita conferência; não possibilita descoberta em massa.

Também há uma diferença entre usar o padrão e ter todo o passado no ADN. O manual diz que o DANFSe pode ser obtido para notas de sistemas próprios apenas quando o município transcreveu o documento para o leiaute nacional e o compartilhou com o ADN. Logo, adesão atual não garante cobertura retroativa.

## Florianópolis

Florianópolis é um bom primeiro caso porque simplificou o presente. A Prefeitura [migrou integralmente para o Emissor Nacional](https://devportal.pmf.sc.gov.br/entidades/fazenda/index.php?noti=27209&pagina=notpagina), com uso obrigatório para todos os contribuintes desde 1º de dezembro de 2025 e descontinuação do emissor próprio. Para NFS-e emitidas depois da migração, devemos negociar acesso pelo ADN com a Prefeitura e usar chaves publicadas nos processos de despesa como alternativa de conferência.

As NFS-e anteriores à migração continuam no sistema municipal antigo. O [manual de integração da NFPS-e de Florianópolis](https://nfps-e-hml.pmf.sc.gov.br/home/Manual%20de%20integra%C3%A7%C3%A3o%20de%20servi%C3%A7os.pdf) exige credenciais e documenta consultas próprias. Portanto, uma única integração nacional não cobre o histórico de Floripa.

Plano mínimo para Floripa:

1. Obter das bases de execução orçamentária as chaves de NF-e/NFS-e e os identificadores de liquidação e pagamento.
2. Conferir por chave no portal nacional quando isso bastar.
3. Pedir à Prefeitura um feed autorizado das notas em que seus órgãos são tomadores ou destinatários. Para NFS-e novas, via ADN. Para o legado, uma exportação única do sistema antigo é mais simples que manter sua API indefinidamente.
4. Publicar o vínculo entre emenda, transferência, empenho, liquidação, pagamento e nota. A nota isolada não prova que o recurso veio de uma emenda.

## Sigilo fiscal, LGPD e publicação

Receber acesso técnico não autoriza publicar o XML inteiro. O [art. 198 do Código Tributário Nacional](https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm) proíbe a Fazenda de divulgar informações obtidas em razão do ofício sobre a situação econômica ou financeira e os negócios do contribuinte. O intercâmbio de informação sigilosa entre órgãos também exige processo formal e preservação do sigilo.

A [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) exige finalidade, adequação e necessidade mesmo para dados de acesso público. Seus arts. 23 a 27 impõem finalidade pública, transparência sobre o tratamento e limites à transferência de bases públicas para entidades privadas. CPF, endereço, telefone, e-mail e descrições que identifiquem pessoas naturais precisam de revisão, minimização ou ocultação.

A LAI favorece a transparência sobre a destinação de recursos públicos, mas mantém as restrições legais de sigilo fiscal e informação pessoal. A [orientação oficial da CGU](https://www.gov.br/acessoainformacao/pt-br/perguntas-frequentes/aspectos-gerais) explica as duas coisas. Para publicação, o Emenda deve preferir dados do processo de despesa e um recorte da nota: chave, CNPJ e nome do fornecedor, órgão comprador, data, valor, itens ou serviço, situação e fonte do documento. Não deve publicar automaticamente o XML bruto.

## Decisão recomendada

Usar os portais nacionais como camada de verificação, não como mecanismo de descoberta. Para cobertura completa:

- NF-e: integração autorizada com o CNPJ do órgão comprador e consumo por NSU;
- NFS-e de Floripa desde dezembro de 2025: acordo com a Prefeitura para distribuição pelo ADN;
- NFS-e antiga de Floripa: exportação única do sistema municipal;
- demais municípios: priorizar os aderentes ao padrão nacional, mas ainda negociar autorização ou obter as chaves nos processos públicos.

Isso evita manter centenas de conectores municipais no futuro. Não elimina o legado, nem transforma dados fiscais em dados abertos.

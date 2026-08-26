import { getFloripaCoverage } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function MethodologyPage() {
  const coverage = await getFloripaCoverage();
  return (
    <main className="content-page">
      <header>
        <p className="kicker">Como sabemos?</p>
        <h1>Método aberto.</h1>
        <p className="lede">Mostramos o que a fonte diz, o que conseguimos ligar e onde faltam dados.</p>
      </header>
      <article className="prose">
        <h2>De onde vêm os dados</h2>
        <p>
          Emendas, empenhos e pagamentos vêm das APIs públicas do Transferegov. Dados de gastos
          começam por Florianópolis e entram apenas por entrega autorizada do recebedor ou feed
          autorizado — nunca por enumeração pública de todas as notas.
        </p>
        <h2>Cobertura de Florianópolis</h2>
        {coverage.length ? (
          <ul>
            {coverage.map((row) => (
              <li key={`${row.recipientKey}-${row.source}`}>
                <strong>{row.sourceLabel}</strong> · {formatDate(row.periodStart)} a{" "}
                {formatDate(row.periodEnd)} · última sincronização {formatDate(row.lastSyncedAt)}
                {row.knownGaps.length ? (
                  <small> Lacunas: {row.knownGaps.join("; ")}</small>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Ainda sem sincronização fiscal publicada. NFS-e desde 1 de dezembro de 2025 deve usar o
            Ambiente de Dados Nacional; o histórico anterior depende de exportação única do emissor
            municipal antigo.
          </p>
        )}
        <h2>Confirmado ou provável</h2>
        <p>
          Um vínculo é confirmado quando a fonte oficial relaciona diretamente gasto e emenda. Quando
          valor, data, órgão ou fornecedor indicam relação sem confirmação explícita, marcamos como
          provável e mostramos os motivos. Não usamos uma percentagem opaca. Nota isolada, sem cadeia
          até a origem do recurso, não cria vínculo confirmado.
        </p>
        <h2>O que ausência significa</h2>
        <p>
          &quot;Sem comprovação encontrada&quot; significa que nenhuma fonte dentro da nossa cobertura
          sustentou o gasto. Não significa que o documento inexiste.
        </p>
        <h2>Atualização</h2>
        <p>
          A base federal verifica novas cargas no primeiro dia de cada mês. A fonte fiscal tem
          sincronização própria. Cada página mostra a data da fonte, não apenas a data da nossa
          consulta.
        </p>
      </article>
    </main>
  );
}

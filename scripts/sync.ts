import { syncTransferegov } from "../src/lib/sync";

async function main() {
  for (const stage of ["beneficiarios", "emendas", "empenhos", "pagamentos"] as const) {
    console.log(await syncTransferegov(stage));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

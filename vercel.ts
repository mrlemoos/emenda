import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    { path: "/api/sync/beneficiarios", schedule: "0 6 1 * *" },
    { path: "/api/sync/emendas", schedule: "0 7 1 * *" },
    { path: "/api/sync/empenhos", schedule: "0 8 1 * *" },
    { path: "/api/sync/pagamentos", schedule: "0 9 1 * *" },
  ],
};

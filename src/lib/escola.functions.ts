import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const consultaEscolaSchema = z.object({
  inep: z.string().regex(/^\d{8}$/, "O código INEP deve ter exatamente 8 números."),
});

type RegistroEscola = [nome: string, municipio: string, uf: string, situacao: string];

export interface EscolaInep {
  inep: string;
  nome: string;
  municipio: string;
  uf: string;
  situacao: "Em atividade" | "Paralisada" | "Extinta" | "Não informada";
  fonte: string;
}

const situacoes: Record<string, EscolaInep["situacao"]> = {
  "1": "Em atividade",
  "2": "Paralisada",
  "3": "Extinta",
};

export const consultarEscolaPorInep = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => consultaEscolaSchema.parse(input))
  .handler(async ({ data }): Promise<EscolaInep | null> => {
    const request = getRequest();
    const origem = new URL(request.url).origin;
    const resposta = await fetch(`${origem}/data/escolas-inep/${data.inep.slice(0, 2)}.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) throw new Error("A base oficial de escolas está indisponível no momento.");
    const registros = (await resposta.json()) as Record<string, RegistroEscola>;
    const escola = registros[data.inep];
    if (!escola) return null;
    return {
      inep: data.inep,
      nome: escola[0],
      municipio: escola[1],
      uf: escola[2],
      situacao: situacoes[escola[3]] ?? "Não informada",
      fonte: "Censo Escolar 2024 — INEP",
    };
  });

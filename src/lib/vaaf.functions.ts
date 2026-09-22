import { createServerFn } from "@tanstack/react-start";

import { ANO_REFERENCIA, PARAMETROS_FUNDEB } from "./fnde";

export interface ParametrosFundebResposta {
  ano: number;
  vaaf: number;
  vaat: number | null;
  origem: "embutido";
  fonte: string;
  url: string | null;
  atualizadoEm: string;
}

/**
 * Retorna parâmetros oficiais versionados no código.
 *
 * A versão anterior raspava HTML da Undime a cada seleção de município.
 * Isso adicionava latência, podia falhar por indisponibilidade externa e,
 * pior, podia devolver o valor do exercício errado em simulações históricas.
 *
 * O VAAF usado pelos programas é nacional. Município não muda esse valor.
 * Atualizações anuais devem entrar em PARAMETROS_FUNDEB junto com seus testes
 * de regressão e referência normativa.
 */
export const obterParametrosFundeb = createServerFn({ method: "GET" })
  .inputValidator((input: { ano?: number } | undefined) => ({
    ano: input?.ano ?? ANO_REFERENCIA,
  }))
  .handler(async ({ data }): Promise<ParametrosFundebResposta> => {
    const parametros = PARAMETROS_FUNDEB[data.ano];
    if (!parametros) {
      throw new Error(`Não há parâmetros oficiais cadastrados para o Fundeb ${data.ano}.`);
    }

    return {
      ano: data.ano,
      vaaf: parametros.vaafMin,
      vaat: null,
      origem: "embutido",
      fonte: `${parametros.fonte} · ${parametros.ato}`,
      url: null,
      atualizadoEm: new Date().toISOString(),
    };
  });

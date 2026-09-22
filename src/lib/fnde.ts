export const ANO_REFERENCIA = 2026;
export const MESES_MAXIMOS_REPASSE = 18;

export type Programa = "turmas" | "estabelecimentos";
export type Etapa = "Creche" | "Pré-escola";
export type Turno = "Integral" | "Parcial";
export type Modalidade = "Regular" | "Educação Especial";

export interface ValoresAlunoAno {
  crecheIntegral: number;
  crecheParcial: number;
  preEscolaIntegral: number;
  preEscolaParcial: number;
}

export interface ParametrosFundeb {
  anoBase: number;
  vaafMin: number;
  fatores: Record<Etapa, Record<Turno, number>>;
  valoresAlunoAno: ValoresAlunoAno;
  fonte: string;
  ato: string;
}

const FATORES_2024: Record<Etapa, Record<Turno, number>> = {
  Creche: { Integral: 1.5, Parcial: 1.25 },
  "Pré-escola": { Integral: 1.4, Parcial: 1.15 },
};

const FATORES_2025_2026: Record<Etapa, Record<Turno, number>> = {
  Creche: { Integral: 1.55, Parcial: 1.25 },
  "Pré-escola": { Integral: 1.5, Parcial: 1.15 },
};

/**
 * Valores mínimos nacionais publicados pelo Fundeb, já arredondados por
 * categoria. O cálculo do programa usa estes valores publicados (e não
 * VAAF-MIN x fator com precisão infinita), reproduzindo o comportamento do FNDE.
 */
export const PARAMETROS_FUNDEB: Readonly<Record<number, ParametrosFundeb>> = {
  2024: {
    anoBase: 2024,
    vaafMin: 5648.91,
    fatores: FATORES_2024,
    valoresAlunoAno: {
      crecheIntegral: 8473.37,
      crecheParcial: 7061.14,
      preEscolaIntegral: 7908.5,
      preEscolaParcial: 6496.25,
    },
    fonte: "FNDE — Fundeb 2024",
    ato: "Portaria Interministerial MEC/MF nº 13, de 23/12/2024",
  },
  2025: {
    anoBase: 2025,
    vaafMin: 5696.84,
    fatores: FATORES_2025_2026,
    valoresAlunoAno: {
      crecheIntegral: 8830.09,
      crecheParcial: 7121.04,
      preEscolaIntegral: 8545.25,
      preEscolaParcial: 6551.36,
    },
    fonte: "FNDE — Fundeb 2025",
    ato: "Portaria Interministerial MEC/MF nº 11, de 27/11/2025",
  },
  2026: {
    anoBase: 2026,
    vaafMin: 6030.44,
    fatores: FATORES_2025_2026,
    valoresAlunoAno: {
      crecheIntegral: 9347.19,
      crecheParcial: 7538.05,
      preEscolaIntegral: 9045.67,
      preEscolaParcial: 6935.01,
    },
    fonte: "FNDE — Fundeb 2026",
    ato: "Portaria Interministerial MEC/MF nº 11, de 28/08/2026 (vigente desde 01/09/2026)",
  },
} as const;

export const VAAF_NACIONAL_2026 = PARAMETROS_FUNDEB[2026]!.vaafMin;
function parseDataIso(data: string): { ano: number; mes: number; dia: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!match) return null;
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia)
    return null;
  return { ano, mes, dia };
}

function compararDatas(
  a: { ano: number; mes: number; dia: number },
  b: { ano: number; mes: number; dia: number },
): number {
  return a.ano - b.ano || a.mes - b.mes || a.dia - b.dia;
}

export function diaNacionalCenso(ano: number): string {
  const ultimoDia = new Date(Date.UTC(ano, 5, 0));
  const deslocamento = (ultimoDia.getUTCDay() - 3 + 7) % 7;
  const dia = ultimoDia.getUTCDate() - deslocamento;
  return `${ano}-05-${String(dia).padStart(2, "0")}`;
}

export function anoCensoQueComputaraMatricula(dataInicio: string): number | null {
  const inicio = parseDataIso(dataInicio);
  if (!inicio) return null;
  const censo = parseDataIso(diaNacionalCenso(inicio.ano));
  if (!censo) return null;
  return compararDatas(inicio, censo) <= 0 ? inicio.ano : inicio.ano + 1;
}

/**
 * Meses elegíveis entre o registro no Simec e o início do recebimento pelo
 * Fundeb. O mês do registro conta integralmente; o total é limitado a 18.
 * Turmas/estabelecimentos iniciados em novembro/dezembro só geram apoio no
 * exercício subsequente, conforme Resoluções CD/FNDE nº 6 e nº 7/2025.
 */
export function mesesDeFuncionamento(dataInicio: string, dataRegistroSimec: string): number {
  const inicio = parseDataIso(dataInicio);
  const registro = parseDataIso(dataRegistroSimec);
  if (!inicio || !registro || compararDatas(registro, inicio) < 0) return 0;

  const anoCenso = anoCensoQueComputaraMatricula(dataInicio);
  if (!anoCenso) return 0;

  const inicioFundeb = { ano: anoCenso + 1, mes: 1, dia: 1 };
  if (compararDatas(registro, inicioFundeb) >= 0) return 0;

  let anoInicial = registro.ano;
  let mesInicial = registro.mes;
  if (inicio.mes >= 11 && registro.ano === inicio.ano) {
    anoInicial = inicio.ano + 1;
    mesInicial = 1;
  }

  const mesesAteFundeb = (anoCenso - anoInicial) * 12 + (12 - mesInicial) + 1;
  return Math.max(0, Math.min(MESES_MAXIMOS_REPASSE, mesesAteFundeb));
}

export function anoBaseDoPrograma(
  programa: Programa,
  dataInicio: string,
  dataRegistroSimec: string,
): number | null {
  const inicio = parseDataIso(dataInicio);
  const registro = parseDataIso(dataRegistroSimec);
  if (!inicio || !registro) return null;
  return programa === "estabelecimentos" ? inicio.ano - 1 : registro.ano;
}

export function parametrosFundebPorAno(ano: number): ParametrosFundeb | null {
  return PARAMETROS_FUNDEB[ano] ?? null;
}

export function obterParametrosFundeb(
  programa: Programa,
  dataInicio: string,
  dataRegistroSimec: string,
): ParametrosFundeb | null {
  const anoBase = anoBaseDoPrograma(programa, dataInicio, dataRegistroSimec);
  return anoBase ? parametrosFundebPorAno(anoBase) : null;
}

export function calcularFator(
  etapa: Etapa,
  turno: Turno,
  _modalidade: Modalidade = "Regular",
  anoBase = ANO_REFERENCIA,
): number {
  const parametros = parametrosFundebPorAno(anoBase);
  if (!parametros) {
    throw new RangeError(`Não há parâmetros oficiais cadastrados para o Fundeb ${anoBase}.`);
  }
  return parametros.fatores[etapa][turno];
}

function chaveValor(etapa: Etapa, turno: Turno): keyof ValoresAlunoAno {
  if (etapa === "Creche") return turno === "Integral" ? "crecheIntegral" : "crecheParcial";
  return turno === "Integral" ? "preEscolaIntegral" : "preEscolaParcial";
}

export function arredondarMoeda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function valorAlunoAno(
  parametros: ParametrosFundeb,
  etapa: Etapa,
  turno: Turno,
  vaafInformado = parametros.vaafMin,
): number {
  if (!Number.isFinite(vaafInformado) || vaafInformado <= 0) return 0;
  if (Math.abs(vaafInformado - parametros.vaafMin) < 0.005) {
    return parametros.valoresAlunoAno[chaveValor(etapa, turno)];
  }
  return arredondarMoeda(vaafInformado * parametros.fatores[etapa][turno]);
}

export function calcularRepasse(
  valorAnualPorAluno: number,
  alunos: number,
  meses: number,
): { valorAnual: number; repasse: number } {
  const quantidade = Number.isFinite(alunos) ? Math.max(0, alunos) : 0;
  const mesesValidos = Number.isFinite(meses)
    ? Math.max(0, Math.min(MESES_MAXIMOS_REPASSE, meses))
    : 0;
  const unitario = Number.isFinite(valorAnualPorAluno) ? Math.max(0, valorAnualPorAluno) : 0;

  // Os valores aluno/ano oficiais já são publicados em centavos. Fazer a parte
  // financeira em centavos evita deriva binária de ponto flutuante nos totais.
  const unitarioCentavos = Math.round(unitario * 100);
  const valorAnualCentavos = Math.round(unitarioCentavos * quantidade);
  const repasseCentavos = Math.round((unitarioCentavos * quantidade * mesesValidos) / 12);

  return {
    valorAnual: valorAnualCentavos / 100,
    repasse: repasseCentavos / 100,
  };
}

export function calcularRepassePrograma(args: {
  programa: Programa;
  dataInicio: string;
  dataRegistroSimec: string;
  etapa: Etapa;
  turno: Turno;
  alunos: number;
  vaafInformado?: number;
}): {
  anoBase: number;
  fator: number;
  valorUnitario: number;
  meses: number;
  valorAnual: number;
  repasse: number;
} | null {
  const parametros = obterParametrosFundeb(args.programa, args.dataInicio, args.dataRegistroSimec);
  if (!parametros) return null;
  const meses = mesesDeFuncionamento(args.dataInicio, args.dataRegistroSimec);
  const fator = calcularFator(args.etapa, args.turno, "Regular", parametros.anoBase);
  const valorUnitario = valorAlunoAno(
    parametros,
    args.etapa,
    args.turno,
    args.vaafInformado ?? parametros.vaafMin,
  );
  return {
    anoBase: parametros.anoBase,
    fator,
    valorUnitario,
    meses,
    ...calcularRepasse(valorUnitario, args.alunos, meses),
  };
}

export function distribuirMatriculas(
  totalRegular: number,
  especiais: number,
): { regularesSemEspecial: number; especiais: number; total: number } {
  const total = Number.isFinite(totalRegular) ? Math.max(0, totalRegular) : 0;
  const especiaisValidos = Number.isFinite(especiais) ? Math.max(0, Math.min(especiais, total)) : 0;
  return { regularesSemEspecial: total - especiaisValidos, especiais: especiaisValidos, total };
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export const fatorFmt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const numeroFmt = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface Combinacao {
  chave: string;
  rotulo: string;
  etapa: Etapa;
  turno: Turno;
  modalidade: Modalidade;
}

export const COMBINACOES: Combinacao[] = (
  [
    ["Regular", "Creche", "Parcial"],
    ["Regular", "Creche", "Integral"],
    ["Regular", "Pré-escola", "Parcial"],
    ["Regular", "Pré-escola", "Integral"],
    ["Educação Especial", "Creche", "Parcial"],
    ["Educação Especial", "Creche", "Integral"],
    ["Educação Especial", "Pré-escola", "Parcial"],
    ["Educação Especial", "Pré-escola", "Integral"],
  ] as [Modalidade, Etapa, Turno][]
).map(([modalidade, etapa, turno]) => ({
  chave: `${modalidade}-${etapa}-${turno}`,
  rotulo: `${modalidade === "Regular" ? "Regular" : "Especial"} · ${etapa} ${turno}`,
  etapa,
  turno,
  modalidade,
}));

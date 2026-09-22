import test from "node:test";
import assert from "node:assert/strict";
import {
  ANO_REFERENCIA,
  PARAMETROS_FUNDEB,
  anoBaseDoPrograma,
  anoCensoQueComputaraMatricula,
  arredondarMoeda,
  calcularFator,
  calcularRepasse,
  calcularRepassePrograma,
  diaNacionalCenso,
  distribuirMatriculas,
  mesesDeFuncionamento,
  obterParametrosFundeb,
  valorAlunoAno,
} from "../src/lib/fnde.ts";

test("ano de referência corrente é 2026", () => assert.equal(ANO_REFERENCIA, 2026));

test("Dia Nacional do Censo 2025 é 28/05", () =>
  assert.equal(diaNacionalCenso(2025), "2025-05-28"));
test("Dia Nacional do Censo 2026 é 27/05", () =>
  assert.equal(diaNacionalCenso(2026), "2026-05-27"));
test("Dia Nacional do Censo 2027 é a última quarta de maio", () =>
  assert.equal(diaNacionalCenso(2027), "2027-05-26"));

test("início no dia do Censo entra no Censo do mesmo ano", () =>
  assert.equal(anoCensoQueComputaraMatricula("2026-05-27"), 2026));
test("início um dia após o Censo entra no Censo seguinte", () =>
  assert.equal(anoCensoQueComputaraMatricula("2026-05-28"), 2027));
test("data inválida não produz ano de Censo", () =>
  assert.equal(anoCensoQueComputaraMatricula("2026-02-30"), null));

test("novos estabelecimentos usam o ano anterior ao início", () =>
  assert.equal(anoBaseDoPrograma("estabelecimentos", "2026-05-29", "2026-07-22"), 2025));
test("estabelecimento iniciado em 2025 usa 2024", () =>
  assert.equal(anoBaseDoPrograma("estabelecimentos", "2025-09-26", "2026-05-07"), 2024));
test("novas turmas usam o ano corrente do registro no Simec", () =>
  assert.equal(anoBaseDoPrograma("turmas", "2025-09-26", "2026-05-07"), 2026));

test("parâmetros 2024 reproduzem os valores publicados", () => {
  assert.deepEqual(PARAMETROS_FUNDEB[2024].valoresAlunoAno, {
    crecheIntegral: 8473.37,
    crecheParcial: 7061.14,
    preEscolaIntegral: 7908.5,
    preEscolaParcial: 6496.25,
  });
});
test("parâmetros 2025 reproduzem os valores do FNDE usados no caso real", () => {
  assert.deepEqual(PARAMETROS_FUNDEB[2025].valoresAlunoAno, {
    crecheIntegral: 8830.09,
    crecheParcial: 7121.04,
    preEscolaIntegral: 8545.25,
    preEscolaParcial: 6551.36,
  });
});
test("parâmetros 2026 ficam explícitos e versionados", () => {
  assert.deepEqual(PARAMETROS_FUNDEB[2026].valoresAlunoAno, {
    crecheIntegral: 9347.19,
    crecheParcial: 7538.05,
    preEscolaIntegral: 9045.67,
    preEscolaParcial: 6935.01,
  });
});

test("fatores 2024 são aplicados às quatro categorias", () => {
  assert.equal(calcularFator("Creche", "Integral", "Regular", 2024), 1.5);
  assert.equal(calcularFator("Creche", "Parcial", "Regular", 2024), 1.25);
  assert.equal(calcularFator("Pré-escola", "Integral", "Regular", 2024), 1.4);
  assert.equal(calcularFator("Pré-escola", "Parcial", "Regular", 2024), 1.15);
});
test("fatores 2025/2026 são aplicados às quatro categorias", () => {
  for (const ano of [2025, 2026]) {
    assert.equal(calcularFator("Creche", "Integral", "Regular", ano), 1.55);
    assert.equal(calcularFator("Creche", "Parcial", "Regular", ano), 1.25);
    assert.equal(calcularFator("Pré-escola", "Integral", "Regular", ano), 1.5);
    assert.equal(calcularFator("Pré-escola", "Parcial", "Regular", ano), 1.15);
  }
});
test("marcação Especial não altera a categoria base da fórmula", () =>
  assert.equal(calcularFator("Pré-escola", "Parcial", "Educação Especial", 2026), 1.15));

test("valorAlunoAno usa valor oficial publicado, não produto não arredondado", () =>
  assert.equal(valorAlunoAno(PARAMETROS_FUNDEB[2024], "Pré-escola", "Parcial"), 6496.25));
test("override manual de VAAF deriva valor e arredonda em centavos", () =>
  assert.equal(valorAlunoAno(PARAMETROS_FUNDEB[2026], "Creche", "Integral", 6000), 9300));
test("override inválido retorna zero", () =>
  assert.equal(valorAlunoAno(PARAMETROS_FUNDEB[2026], "Creche", "Integral", -1), 0));
test("arredondamento monetário é em centavos", () => assert.equal(arredondarMoeda(10.005), 10.01));

test("caso real Simplício Mendes: período é 18 meses", () =>
  assert.equal(mesesDeFuncionamento("2026-05-29", "2026-07-22"), 18));
test("caso real Vicentinópolis: período é 8 meses", () =>
  assert.equal(mesesDeFuncionamento("2025-09-26", "2026-05-07"), 8));
test("limite nunca ultrapassa 18 meses", () =>
  assert.equal(mesesDeFuncionamento("2026-06-01", "2026-06-01"), 18));
test("início em novembro só gera apoio a partir do exercício seguinte", () =>
  assert.equal(mesesDeFuncionamento("2026-11-05", "2026-11-05"), 12));
test("início em dezembro só gera apoio a partir do exercício seguinte", () =>
  assert.equal(mesesDeFuncionamento("2026-12-05", "2026-12-10"), 12));
test("registro anterior ao início é inválido", () =>
  assert.equal(mesesDeFuncionamento("2026-07-10", "2026-07-01"), 0));
test("registro depois do início do Fundeb não gera apoio", () =>
  assert.equal(mesesDeFuncionamento("2025-01-10", "2026-01-02"), 0));
test("datas inexistentes não geram meses", () =>
  assert.equal(mesesDeFuncionamento("2026-02-30", "2026-03-01"), 0));

test("cálculo mensal usa 1/12 do valor publicado", () =>
  assert.deepEqual(calcularRepasse(6496.25, 34, 8), { valorAnual: 220872.5, repasse: 147248.33 }));
test("repasse limita meses a 18", () =>
  assert.equal(calcularRepasse(7121.04, 64, 99).repasse, 683619.84));
test("repasse não aceita quantidade negativa", () =>
  assert.equal(calcularRepasse(7121.04, -2, 18).repasse, 0));

test("GOLDEN: Simplício Mendes/PI reproduz total aprovado pelo FNDE", () => {
  const crecheParcial = calcularRepassePrograma({
    programa: "estabelecimentos",
    dataInicio: "2026-05-29",
    dataRegistroSimec: "2026-07-22",
    etapa: "Creche",
    turno: "Parcial",
    alunos: 64,
  });
  const preParcial = calcularRepassePrograma({
    programa: "estabelecimentos",
    dataInicio: "2026-05-29",
    dataRegistroSimec: "2026-07-22",
    etapa: "Pré-escola",
    turno: "Parcial",
    alunos: 4,
  });
  assert.ok(crecheParcial && preParcial);
  assert.equal(crecheParcial.anoBase, 2025);
  assert.equal(crecheParcial.valorUnitario, 7121.04);
  assert.equal(crecheParcial.repasse, 683619.84);
  assert.equal(preParcial.valorUnitario, 6551.36);
  assert.equal(preParcial.repasse, 39308.16);
  assert.equal(arredondarMoeda(crecheParcial.repasse + preParcial.repasse), 722928.0);
});

test("GOLDEN: Vicentinópolis/GO reproduz total aprovado pelo FNDE", () => {
  const linha = calcularRepassePrograma({
    programa: "estabelecimentos",
    dataInicio: "2025-09-26",
    dataRegistroSimec: "2026-05-07",
    etapa: "Pré-escola",
    turno: "Parcial",
    alunos: 34,
  });
  assert.ok(linha);
  assert.equal(linha.anoBase, 2024);
  assert.equal(linha.meses, 8);
  assert.equal(linha.valorUnitario, 6496.25);
  assert.equal(linha.repasse, 147248.33);
});

test("distribuição de especiais não duplica matrículas", () =>
  assert.deepEqual(distribuirMatriculas(20, 3), {
    regularesSemEspecial: 17,
    especiais: 3,
    total: 20,
  }));
test("especiais acima do total são limitados ao total", () =>
  assert.deepEqual(distribuirMatriculas(20, 30), {
    regularesSemEspecial: 0,
    especiais: 20,
    total: 20,
  }));
test("quantidades negativas são saneadas", () =>
  assert.deepEqual(distribuirMatriculas(-10, -2), {
    regularesSemEspecial: 0,
    especiais: 0,
    total: 0,
  }));

test("parâmetros inexistentes são recusados em vez de inventados", () =>
  assert.equal(obterParametrosFundeb("estabelecimentos", "2024-06-01", "2024-06-10"), null));

test("VAAF-MIN versionado acompanha os parâmetros usados pelo motor", () => {
  assert.equal(PARAMETROS_FUNDEB[2024].vaafMin, 5648.91);
  assert.equal(PARAMETROS_FUNDEB[2025].vaafMin, 5696.84);
  assert.equal(PARAMETROS_FUNDEB[2026].vaafMin, 6030.44);
});

test("ano sem parâmetros não cai silenciosamente no exercício corrente", () => {
  assert.throws(
    () => calcularFator("Creche", "Integral", "Regular", 2030),
    /Não há parâmetros oficiais cadastrados/,
  );
});

test("início exatamente no Censo limita apoio até o Fundeb do exercício seguinte", () =>
  assert.equal(mesesDeFuncionamento("2026-05-27", "2026-05-27"), 8));

test("início logo após o Censo permanece sujeito ao teto de 18 meses", () =>
  assert.equal(mesesDeFuncionamento("2026-05-28", "2026-05-28"), 18));

test("turma iniciada em novembro e registrada em janeiro recebe apenas o exercício subsequente", () =>
  assert.equal(mesesDeFuncionamento("2026-11-10", "2027-01-05"), 12));

test("registro no primeiro dia em que o Fundeb já deveria contemplar a matrícula não gera apoio", () =>
  assert.equal(mesesDeFuncionamento("2025-05-28", "2026-01-01"), 0));

test("override manual de VAAF percorre a API de programa sem alterar o ano-base", () => {
  const linha = calcularRepassePrograma({
    programa: "turmas",
    dataInicio: "2026-06-01",
    dataRegistroSimec: "2026-06-15",
    etapa: "Creche",
    turno: "Integral",
    alunos: 10,
    vaafInformado: 6000,
  });
  assert.ok(linha);
  assert.equal(linha.anoBase, 2026);
  assert.equal(linha.valorUnitario, 9300);
  assert.equal(linha.repasse, 139500);
});

test("subconjunto Especial não altera a quantidade financeira da categoria", () => {
  const matriculas = distribuirMatriculas(20, 3);
  const linha = calcularRepassePrograma({
    programa: "turmas",
    dataInicio: "2026-06-01",
    dataRegistroSimec: "2026-06-15",
    etapa: "Creche",
    turno: "Parcial",
    alunos: matriculas.total,
  });
  assert.ok(linha);
  assert.equal(matriculas.total, 20);
  assert.equal(matriculas.regularesSemEspecial + matriculas.especiais, 20);
  assert.equal(linha.repasse, 226141.5);
});

test("NaN e infinito não contaminam o total financeiro", () => {
  assert.deepEqual(calcularRepasse(Number.NaN, Number.POSITIVE_INFINITY, 18), {
    valorAnual: 0,
    repasse: 0,
  });
});

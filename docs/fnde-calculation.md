# Regras de cálculo FNDE

Este documento registra as decisões que a calculadora implementa e os casos usados para impedir regressões.

## Escopo

A interface existente foi preservada. O motor de cálculo foi isolado em `src/lib/fnde.ts` e os parâmetros anuais ficam versionados em `PARAMETROS_FUNDEB`.

## Referências normativas

- Resolução CD/FNDE nº 6, de 28 de abril de 2025 — Novas Turmas.
- Resolução CD/FNDE nº 7, de 28 de abril de 2025 — Novos Estabelecimentos.
- Portarias Interministeriais MEC/MF do Fundeb de cada exercício, usadas para os valores aluno/ano e fatores de ponderação.
- Dia Nacional do Censo Escolar: última quarta-feira de maio.

## Regras implementadas

1. O apoio é mensal e usa 1/12 do valor anual por aluno da categoria.
2. O período é limitado a 18 meses.
3. O mês de registro no Simec conta no período elegível.
4. O início do recebimento regular pelo Fundeb encerra o período do apoio.
5. Para estabelecimentos iniciados em novembro ou dezembro, o apoio começa no exercício seguinte.
6. Novos Estabelecimentos usam, para a base do cálculo, o valor anual mínimo nacional do ano anterior ao início do atendimento.
7. Novas Turmas usam os parâmetros do exercício do registro no Simec.
8. O cálculo usa o valor aluno/ano oficialmente publicado para a categoria; não recompõe esse valor apenas multiplicando o VAAF exibido pelo fator, evitando diferenças de centavos causadas pelos valores completos usados nas portarias.
9. Matrículas especiais são subconjunto do total informado e não aumentam artificialmente o número total de alunos.
10. Ano sem parâmetros cadastrados é recusado em vez de receber um valor aproximado ou silenciosamente desatualizado.

## Casos de regressão do FNDE

### Simplício Mendes/PI — Novos Estabelecimentos

- Início do atendimento: 29/05/2026
- Registro/envio para análise: 22/07/2026
- Período: 18 meses
- Creche parcial: 64 × R$ 7.121,04 → R$ 683.619,84
- Pré-escola parcial: 4 × R$ 6.551,36 → R$ 39.308,16
- Total esperado: **R$ 722.928,00**

### Vicentinópolis/GO — Novos Estabelecimentos

- Início do atendimento: 26/09/2025
- Registro/envio para análise: 07/05/2026
- Período: 8 meses
- Pré-escola parcial: 34 × R$ 6.496,25
- Total esperado: **R$ 147.248,33**

Esses casos estão automatizados em `tests/fnde.test.ts`.

## Atualização anual

Ao entrar um novo exercício:

1. adicionar uma entrada em `PARAMETROS_FUNDEB`;
2. registrar o ato normativo correspondente;
3. adicionar testes para os quatro valores aluno/ano e fatores;
4. adicionar ao menos um caso oficial/real de regressão quando disponível;
5. executar `bun run test`, `bun run lint` e `bun run build`.

Não alterar números antigos para refletir portarias novas: simulações históricas precisam continuar reproduzíveis.

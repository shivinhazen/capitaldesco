# Regras de cálculo FNDE

Especificação humana do motor da calculadora. Em caso de divergência entre este documento e uma fonte oficial mais recente/aplicável, a fonte oficial prevalece e código + testes + documentação devem ser atualizados juntos.

## 1. Fontes oficiais principais

- [Resolução CD/FNDE nº 6, de 28 de abril de 2025 — Novas Turmas](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2025/resolucao-no-6-de-28-de-abril-de-2025-resolucao-no-6-de-28-de-abril-de-2025-dou-imprensa-nacional.pdf/@@download/file)
- [Resolução CD/FNDE nº 7, de 28 de abril de 2025 — Novos Estabelecimentos](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2025/resolucao-no-7-de-28-de-abril-de-2025-resolucao-no-7-de-28-de-abril-de-2025-dou-imprensa-nacional.pdf/@@download/file)
- [Portaria Interministerial MEC/MF nº 13, de 23 de dezembro de 2024](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/legislacao/2024/portaria-interministerial-mecmf-no-13-de-23-de-dezembro-de-2024.pdf/view)
- [Portaria Interministerial MEC/MF nº 11, de 27 de novembro de 2025](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/legislacao/2025/portaria-interministerial-mec-mf-no-11-de-27-de-novembro-de-2025/view)
- [Portaria Interministerial MEC/MF nº 11, de 28 de agosto de 2026](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/legislacao/2026/portaria-interministerial-mec-mf-no-11-de-28-de-agosto-de-2026/view)

## 2. Fórmula-base

As Resoluções nº 6 e nº 7 expressam o cálculo pelas quatro categorias:

- Creche Integral (CI);
- Creche Parcial (CP);
- Pré-escola Integral (PEI);
- Pré-escola Parcial (PEP).

Para cada categoria:

~~~text
repasse = (valor aluno/ano publicado ÷ 12) × meses elegíveis × matrículas
~~~

O total é a soma das categorias.

A implementação trabalha com o **valor aluno/ano oficialmente publicado em centavos**. Ela não reconstrói o valor oficial apenas a partir do VAAF arredondado exibido, pois isso pode introduzir divergência de centavos.

## 3. Período elegível

Regras implementadas:

1. o apoio é limitado ao intervalo entre o registro no Simec e a entrada das matrículas no Fundeb;
2. o limite é 18 meses;
3. o mês do registro conta integralmente;
4. turmas/estabelecimentos iniciados antes ou no Dia Nacional do Censo entram no Censo daquele ano;
5. iniciados depois do Dia Nacional do Censo entram no Censo do ano seguinte;
6. início em novembro/dezembro só gera apoio a partir do exercício subsequente;
7. registro posterior ao momento em que as matrículas já deveriam estar contempladas pelo Fundeb resulta em zero meses.

O campo da aplicação representa a data operacional de **registro/envio no Simec** usada para contar o apoio. Nos casos reais fornecidos, a tela do FNDE apresenta essa referência como “Data de envio para análise”.

## 4. Exceção normativa não automatizada

A Resolução nº 6/2025 prevê exceção quando a nova turma começa a funcionar enquanto o sistema está fechado para registro: em determinadas condições, a data inicial de funcionamento pode ser usada, desde que o registro ocorra nos primeiros 45 dias após a reabertura.

A interface atual **não coleta a janela de fechamento/reabertura do sistema**. Portanto essa exceção não é inferida automaticamente.

Se esse cenário precisar ser suportado, adicionar os dados necessários, regra explícita e casos de teste. Não tentar detectar a exceção por heurística.

## 5. Ano-base por programa

### Novas Turmas

A Resolução nº 6 usa o valor nacional referente ao VAAF **do ano corrente**.

Na implementação atual, o exercício é o ano do registro/envio informado no Simec.

### Novos Estabelecimentos

A Resolução nº 7 determina o valor nacional referente ao VAAF **do ano anterior**. A implementação usa o ano anterior ao início do atendimento.

Essa interpretação também é protegida pelos casos reais fornecidos pelo FNDE.

## 6. Snapshots Fundeb suportados

O projeto mantém snapshots explícitos, não scraping em tempo de execução.

| Snapshot | VAAF-MIN | Creche Integral | Creche Parcial | Pré-escola Integral | Pré-escola Parcial | Referência |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2024 | R$ 5.648,91 | R$ 8.473,37 | R$ 7.061,14 | R$ 7.908,50 | R$ 6.496,25 | Portaria 13/2024 |
| 2025 | R$ 5.696,84 | R$ 8.830,09 | R$ 7.121,04 | R$ 8.545,25 | R$ 6.551,36 | Portaria 11/2025 |
| 2026 | R$ 6.030,44 | R$ 9.347,19 | R$ 7.538,05 | R$ 9.045,67 | R$ 6.935,01 | Portaria 11/2026, publicada em 01/09/2026 |

### Política de atualização dentro do ano

O Fundeb pode ter mais de uma publicação no mesmo exercício.

A calculadora atual usa **um snapshot operacional selecionado por exercício**; em 2026, o snapshot corrente é a Portaria nº 11/2026.

Ela **não promete replay temporal completo** de qual estimativa estava vigente em qualquer data histórica dentro do ano. Se esse requisito surgir, a estrutura deve evoluir para snapshots com intervalos de vigência explícitos antes de mudar resultados históricos.

## 7. VAAF manual

O VAAF exibido pode ser alterado manualmente para simulação.

Quando o valor é exatamente o snapshot oficial, o motor usa os valores aluno/ano publicados.

Quando o usuário informa outro VAAF, a aplicação deriva valores simulados pelos fatores aplicáveis e marca a fonte na interface como valor manual. Esse resultado é estimativo, não deve ser tratado como valor oficial publicado.

O botão de restauração retorna ao snapshot oficial selecionado.

## 8. Matrículas especiais

As fórmulas das Resoluções nº 6 e nº 7 usam as quatro categorias de etapa/turno e não criam uma quinta categoria financeira de “Educação Especial”.

No CapitalDesco:

- o total Regular é a quantidade financeira da categoria;
- Especial é registrado apenas como **subconjunto informativo** desse total;
- Especial nunca é somado novamente ao total;
- marcar Especial não cria linha financeira adicional nem altera o valor da categoria.

Isso evita dupla contagem e também evita diferenças artificiais de centavos causadas por dividir a mesma categoria em parcelas separadas e arredondá-las individualmente.

## 9. Golden cases

### Simplício Mendes/PI — Novos Estabelecimentos

- início do atendimento: 29/05/2026;
- registro/envio para análise: 22/07/2026;
- período: 18 meses;
- Creche Parcial: 64 matrículas × R$ 7.121,04 → R$ 683.619,84;
- Pré-escola Parcial: 4 matrículas × R$ 6.551,36 → R$ 39.308,16;
- total: **R$ 722.928,00**.

### Vicentinópolis/GO — Novos Estabelecimentos

- início do atendimento: 26/09/2025;
- registro/envio para análise: 07/05/2026;
- período: 8 meses;
- Pré-escola Parcial: 34 matrículas × R$ 6.496,25;
- total: **R$ 147.248,33**.

Esses casos estão em `tests/fnde.test.ts` e devem continuar reproduzíveis centavo a centavo.

## 10. Comportamento fail-closed

Se o exercício necessário não possuir snapshot cadastrado:

- não usar o exercício corrente como fallback;
- não buscar um número aproximado em página de terceiros;
- bloquear o cálculo e informar que faltam parâmetros oficiais suportados.

## 11. Atualização anual/checklist

Ao incorporar uma publicação nova:

1. conferir a fonte oficial;
2. registrar ato e snapshot;
3. usar os valores aluno/ano publicados, preservando centavos;
4. adicionar/ajustar testes dos fatores e valores;
5. executar golden cases;
6. avaliar se a mudança substitui o snapshot operacional do mesmo ano ou exige vigência histórica;
7. rodar `bun run test`, `bun run typecheck`, `bun run lint` e `bun run build`;
8. atualizar este documento no mesmo PR.

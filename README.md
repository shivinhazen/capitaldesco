# CapitalDesco — Calculadora de Repasse FNDE

Aplicação web para simular repasses do FNDE em **Novas Turmas** e **Novos Estabelecimentos**, com parâmetros Fundeb versionados, período elegível, validações e exportação em PDF.

**Aplicação publicada:** https://capitaldesco.lovable.app

> O README original reproduzia o prompt usado para gerar a primeira versão no Lovable. Esse prompt é histórico, não uma especificação normativa. Para cálculo, a fonte de verdade é a documentação oficial do FNDE/Fundeb, complementada por casos reais e testes automatizados.

## Princípios do projeto

- **Correção antes de conveniência:** números do FNDE não são inferidos da interface nem de prompts antigos.
- **Frontend preservado por padrão:** não há objetivo de redesenhar o produto.
- **Determinismo:** parâmetros nacionais usados no cálculo ficam versionados no repositório.
- **Fail closed:** exercício sem parâmetro cadastrado bloqueia o cálculo em vez de usar um número silenciosamente incorreto.
- **Regressão real:** exemplos já calculados pelo FNDE são protegidos por testes centavo a centavo.
- **Performance útil:** chamadas externas desnecessárias são eliminadas e dados estáveis são reutilizados em cache.

## Stack

- TanStack Start
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui / Radix UI
- Bun
- jsPDF / jsPDF-AutoTable

## Estrutura relevante

~~~text
src/
  lib/
    fnde.ts              # motor de domínio e snapshots Fundeb suportados
    ibge.ts              # estados/municípios, com cache em memória
    escola.functions.ts  # consulta local da base INEP
  routes/
    index.tsx             # interface e orquestração

tests/
  fnde.test.ts            # regras, limites e golden cases do FNDE
  ibge.test.ts            # cache e falhas da integração de localidades

docs/
  fnde-calculation.md     # especificação de cálculo, fontes e limitações
  ai-development.md       # guia AI-first de desenvolvimento

.github/workflows/
  quality.yml             # tests + typecheck + lint + build
~~~

## Desenvolvimento

Bun é o runtime/gerenciador preferencial:

~~~bash
bun install
bun run dev
~~~

### Quality gate

Antes de considerar uma alteração pronta:

~~~bash
bun run test
bun run typecheck
bun run lint
bun run build
~~~

O mesmo gate roda no GitHub Actions.

## Fonte de verdade do cálculo

A ordem de autoridade é:

1. atos e publicações oficiais do FNDE/Fundeb;
2. exemplos reais já calculados pelo FNDE;
3. testes automatizados;
4. implementação.

A interface e o histórico do Lovable não substituem os itens acima.

Leia [docs/fnde-calculation.md](docs/fnde-calculation.md) antes de alterar datas, períodos, VAAF, valores aluno/ano, fatores ou matrículas.

## Casos de regressão já protegidos

Entre os casos reais:

- **Simplício Mendes/PI:** R$ 722.928,00;
- **Vicentinópolis/GO:** R$ 147.248,33.

Os resultados devem continuar reproduzíveis centavo a centavo.

## Desenvolvimento com IA

O repositório foi preparado para trabalho AI-first. Um agente novo deve começar por:

1. [AGENTS.md](AGENTS.md);
2. [docs/ai-development.md](docs/ai-development.md);
3. [docs/fnde-calculation.md](docs/fnde-calculation.md), quando tocar domínio FNDE;
4. testes existentes da área alterada.

A regra é simples: **não inventar regra de negócio para fazer código ou teste passar**.

## Git, Lovable e deploy

O upstream `desconet/capitaldesco` é o repositório conectado ao Lovable.

- desenvolvimento/revisão pode acontecer em fork e feature branch;
- o fork não é produção;
- mudanças aprovadas chegam ao upstream por Pull Request;
- não faça force-push nem reescreva histórico já sincronizado com o Lovable;
- antes de abrir/atualizar PR, confirme que o branch está baseado no `main` atual do upstream;
- merge só depois de todos os gates verdes e revisão do diff.

## Atualização de parâmetros

Não substitua parâmetros históricos por valores de outro exercício.

Para atualizar o Fundeb, adicione/ajuste o snapshot explicitamente, registre a publicação oficial correspondente e acrescente testes. O procedimento e a política de snapshots estão em [docs/fnde-calculation.md](docs/fnde-calculation.md).

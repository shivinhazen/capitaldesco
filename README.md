# CapitalDesco — Calculadora de Repasse FNDE

Aplicação web para simular repasses do FNDE em **Novas Turmas** e **Novos Estabelecimentos**, com cálculo por categoria de educação infantil, período elegível, parâmetros Fundeb versionados e exportação em PDF.

**Aplicação publicada:** https://capitaldesco.lovable.app

> O README antigo reproduzia o prompt inicial usado para gerar o projeto no Lovable. Ele foi substituído porque aquele texto continha regras provisórias e valores que não devem ser usados como fonte de verdade para o cálculo.

## Estado do projeto

O projeto continua visualmente baseado na versão criada no Lovable. A prioridade atual é manter a experiência existente e melhorar o que fica por baixo dela:

- cálculo reproduzível e fundamentado em regras públicas do FNDE;
- parâmetros Fundeb separados por exercício;
- casos reais de regressão;
- validação automática antes de integrar mudanças;
- menor dependência de consultas externas em tempo de uso;
- manutenção simples para exercícios futuros.

Não há objetivo de redesenhar a interface. Mudanças visuais devem ser feitas apenas quando algo estiver quebrado, confuso ou prejudicar o uso.

## Stack

- TanStack Start
- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui / Radix UI
- Bun como gerenciador/runtime preferencial
- jsPDF para relatórios

## Estrutura relevante

~~~text
src/
  lib/
    fnde.ts              # motor de cálculo e parâmetros anuais
    vaaf.functions.ts    # acesso aos parâmetros oficiais versionados
    ibge.ts              # estados e municípios, com cache em sessão
    escola.functions.ts  # consulta local da base INEP
  routes/
    index.tsx             # interface principal

tests/
  fnde.test.ts            # suíte de regressão do cálculo

docs/
  fnde-calculation.md     # regra de negócio e casos-ouro
  ai-development.md       # protocolo AI-first para desenvolvimento

.github/workflows/
  quality.yml             # testes + lint + build
~~~

## Desenvolvimento

### Pré-requisitos

Bun é o caminho preferencial:

~~~bash
bun install
bun run dev
~~~

Também é possível usar npm quando necessário.

### Quality gate

Antes de considerar uma alteração pronta:

~~~bash
bun run test
bun run lint
bun run build
~~~

O GitHub Actions executa os mesmos gates automaticamente.

## Regras de negócio

A fonte de verdade da implementação é:

1. legislação e atos oficiais do FNDE/Fundeb;
2. casos reais já calculados pelo FNDE;
3. testes automatizados que registram esses comportamentos.

A interface, prompts antigos do Lovable e comentários históricos **não são fonte de verdade** para o cálculo.

A documentação completa está em [docs/fnde-calculation.md](docs/fnde-calculation.md).

## Casos de regressão

A suíte contém casos normativos, limites e exemplos reais. Entre eles:

- **Simplício Mendes/PI:** total esperado de R$ 722.928,00;
- **Vicentinópolis/GO:** total esperado de R$ 147.248,33.

Esses valores precisam continuar sendo reproduzidos centavo por centavo.

## Desenvolvimento com IA

Este repositório foi preparado para trabalho AI-first.

Qualquer agente deve começar por:

1. ler [AGENTS.md](AGENTS.md);
2. ler [docs/ai-development.md](docs/ai-development.md);
3. ler [docs/fnde-calculation.md](docs/fnde-calculation.md) antes de alterar cálculo;
4. executar os testes antes e depois da mudança;
5. preservar o frontend por padrão;
6. nunca inventar regra ou valor de FNDE para “fazer o teste passar”.

## Git, Lovable e deploy

O repositório original desconet/capitaldesco está conectado ao Lovable.

- O fork shivinhazen/capitaldesco é usado para desenvolvimento e revisão.
- Alterações no fork **não** devem ser tratadas como publicadas.
- A sincronização com o Lovable ocorre quando mudanças aprovadas chegam ao branch conectado do repositório original.
- Não reescreva histórico já publicado no repositório conectado ao Lovable.
- Prefira branch → testes → Pull Request → revisão → merge.

## Atualização anual

Quando entrar um novo exercício do Fundeb, não substitua parâmetros históricos.

Adicione uma nova entrada versionada, registre a fonte normativa e crie testes correspondentes. O procedimento está detalhado em [docs/fnde-calculation.md](docs/fnde-calculation.md).

# Desenvolvimento AI-first

Este documento reduz a dependência de contexto de conversa: uma IA nova deve conseguir entender o produto, localizar a fonte de verdade e continuar o trabalho sem reconstruir todo o histórico do Lovable.

O `AGENTS.md` contém as regras operacionais obrigatórias. Este arquivo explica o modelo de trabalho.

## 1. Objetivo do produto

CapitalDesco é uma calculadora de apoio para estimar repasses FNDE de:

- Novas Turmas;
- Novos Estabelecimentos.

O usuário informa localidade, datas, categorias e matrículas. A aplicação determina o período elegível, aplica o snapshot Fundeb suportado e apresenta os valores, inclusive em PDF.

Prioridades, nesta ordem:

1. correção;
2. previsibilidade;
3. desempenho percebido;
4. mensagens claras;
5. manutenção simples;
6. preservação da interface existente.

## 2. O que o projeto não é

- Não é um projeto de redesign.
- Não é uma demonstração de framework.
- Não é aceitável aproximar uma regra do FNDE para simplificar código.
- Não é aceitável usar o resultado atual da própria aplicação como prova de correção.
- Não é aceitável mascarar ano/parâmetro desconhecido com fallback silencioso.

## 3. Hierarquia de evidência

### Nível 1 — fonte normativa/oficial

Resoluções, portarias e publicações do FNDE/Fundeb.

### Nível 2 — evidência operacional

Telas/documentos reais cujo resultado foi calculado pelo FNDE.

### Nível 3 — especificação executável

Testes automatizados que registram o comportamento validado.

### Nível 4 — código

A implementação deve obedecer aos níveis anteriores.

Quando houver conflito, subir na hierarquia; nunca justificar uma regra oficial porque “o código já fazia assim”.

## 4. Contexto histórico relevante

A primeira versão veio de um prompt no Lovable. Esse prompt foi útil para gerar UI, mas continha simplificações e não é norma.

Classes de erro já encontradas no projeto:

- valor histórico nomeado como se fosse de 2026;
- VAAF exibido diferente do efetivamente calculado;
- parâmetro de data recebido e ignorado;
- sucessivas interpretações incompatíveis dos 18 meses;
- scraping de página externa para um parâmetro nacional/versionável;
- regra de negócio misturada com renderização;
- risco de dupla contagem de matrículas especiais;
- risco de diferença de centavos ao dividir uma mesma categoria em linhas artificiais.

Trate esses itens como regressões conhecidas.

## 5. Mapa da arquitetura

### `src/lib/fnde.ts` — domínio

Deve concentrar funções determinísticas:

- snapshots Fundeb suportados;
- fatores;
- valores aluno/ano;
- Censo Escolar;
- escolha de ano-base;
- período elegível;
- cálculo monetário;
- validações/regras de matrículas que sejam de domínio.

A matemática financeira usa valores publicados em centavos e deve continuar determinística.

### `src/routes/index.tsx` — interface/orquestração

Responsabilidades:

- estado de formulário;
- seleção de programa;
- validação de UX;
- chamada ao domínio;
- resultado;
- PDF.

Não reimplementar fórmula FNDE dentro do JSX.

### `src/lib/ibge.ts`

Busca estados/municípios e mantém cache em memória. Rede é auxiliar, não fonte do cálculo financeiro.

### `src/lib/escola.functions.ts`

Consulta a base INEP usada pelo projeto. Falha de consulta não deve alterar a matemática do repasse.

## 6. Estratégia de testes

### A. Unidades puras

Cobrir:

- Dia Nacional do Censo;
- ano-base;
- período elegível;
- limites;
- fatores;
- centavos/arredondamento;
- matrículas.

### B. Snapshots anuais

Cada exercício/snapshot suportado deve ter testes dos valores relevantes e da origem documental.

### C. Golden tests

Casos reais calculados pelo FNDE. Não dependem de rede e não podem ser “atualizados” para acomodar uma regressão.

### D. Integrações auxiliares

Mockar rede para testar cache, normalização e falhas previsíveis.

### E. UI/E2E

Adicionar quando um fluxo visual passar a ter risco que não esteja suficientemente protegido pelo domínio. Não duplicar dezenas de testes matemáticos no navegador.

## 7. Como corrigir um bug

1. reproduzir;
2. classificar: domínio, dado, integração ou UI;
3. localizar fonte oficial/evidência;
4. escrever teste que falhe pelo motivo correto;
5. alterar a menor superfície possível;
6. rodar `test`, `typecheck`, `lint` e `build`;
7. revisar diff por mudança visual acidental;
8. atualizar documentação se regra/assunção mudou.

Evite corrigir no componente o que pertence ao domínio.

## 8. Como atualizar Fundeb

Os atos do Fundeb podem ser atualizados durante o próprio exercício. Portanto, “ano” não deve ser confundido com uma verdade eterna e única.

Política atual do produto:

- o repositório mantém um **snapshot selecionado** para cada exercício suportado;
- para 2026, o snapshot corrente é o da Portaria Interministerial MEC/MF nº 11, de 28/08/2026, publicada em 01/09/2026;
- a aplicação atual é uma calculadora operacional, não um mecanismo completo de replay “como estava em qualquer data histórica do ano”;
- se houver requisito de replay temporal, modele snapshots com vigência explícita e testes antes de alterar o comportamento.

Procedimento para atualização:

1. localizar a publicação oficial;
2. registrar o snapshot e o ato;
3. conferir valores aluno/ano publicados — não inferir centavos ausentes;
4. adicionar/ajustar testes;
5. validar golden cases afetados;
6. manter evidência de por que o snapshot mudou.

## 9. Performance: ordem de ataque

Antes de micro-otimizar React:

1. remover chamadas de rede desnecessárias;
2. evitar chamadas duplicadas;
3. cachear lookup estável;
4. evitar parsing/trabalho repetido;
5. evitar efeitos disparados por dependências instáveis;
6. carregar trabalho pesado sob demanda.

A geração de PDF já é carregada dinamicamente; preserve essa característica.

## 10. Política de frontend

Estado padrão: **congelado**.

Permitido sem autorização de redesign:

- consertar comportamento quebrado;
- corrigir texto factualmente incorreto;
- corrigir acessibilidade;
- corrigir layout que impeça uso;
- reduzir jank/espera;
- melhorar erro/loading sem alterar identidade.

Não fazer por preferência pessoal:

- trocar paleta;
- refazer layout;
- trocar componentes só por estética;
- reorganizar fluxo “para ficar moderno”.

## 11. Pull Request ideal

O PR deve informar:

- problema observado;
- regra/evidência usada;
- antes/depois;
- testes adicionados;
- resultado dos quatro quality gates;
- impacto de performance;
- qualquer alteração visual;
- limitações deliberadamente não automatizadas.

Não misturar redesign com correção de cálculo.

## 12. Checklist antes de “pronto”

- [ ] Li `AGENTS.md`.
- [ ] Li `docs/fnde-calculation.md` se toquei domínio.
- [ ] Não usei o prompt Lovable como norma.
- [ ] Bug determinístico tem regressão.
- [ ] Golden cases continuam verdes.
- [ ] Snapshot/ato está documentado.
- [ ] Ano sem suporte falha fechado.
- [ ] Não introduzi mudança visual desnecessária.
- [ ] `bun run test` passou.
- [ ] `bun run typecheck` passou.
- [ ] `bun run lint` passou.
- [ ] `bun run build` passou.
- [ ] Revisei o diff.
- [ ] Upstream não avançou sem reconciliação.

## 13. Handoff mínimo

Ao parar no meio do trabalho, registre:

- branch/commit;
- objetivo;
- validações concluídas;
- checks verdes/vermelhos;
- arquivos alterados;
- decisão pendente;
- próximo passo seguro.

Nunca deixe apenas “continue de onde parei”.

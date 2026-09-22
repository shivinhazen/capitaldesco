# Desenvolvimento AI-first

Este documento permite que uma IA nova entre no projeto e produza mudanças seguras sem precisar reconstruir todo o contexto das conversas que originaram o sistema.

Ele complementa o AGENTS.md. O AGENTS.md define as regras operacionais; este arquivo explica como trabalhar no projeto.

## 1. Objetivo do produto

O CapitalDesco é uma calculadora de apoio para estimar repasses FNDE relacionados a:

- Novas Turmas;
- Novos Estabelecimentos.

O usuário informa localidade, datas, categorias e matrículas. O sistema calcula o período elegível, aplica os parâmetros Fundeb correspondentes e apresenta o resultado, inclusive em PDF.

O produto deve priorizar:

1. correção do cálculo;
2. previsibilidade;
3. resposta rápida;
4. mensagens claras;
5. manutenção simples;
6. preservação da interface já conhecida pelo usuário.

## 2. O que este projeto não é

Não é um exercício de redesign.

Não é uma demonstração de framework.

Não é aceitável “aproximar” a regra do FNDE para simplificar implementação.

Não é aceitável usar a resposta atual da aplicação como prova de que a própria aplicação está certa.

## 3. Fontes de verdade

### Nível 1 — autoridade externa

Legislação, resoluções, portarias e valores oficiais do FNDE/Fundeb.

### Nível 2 — evidência operacional

Exemplos reais cujo resultado foi calculado pelo FNDE.

### Nível 3 — especificação executável

Testes automatizados.

### Nível 4 — código

O código deve implementar os níveis anteriores.

Uma IA nunca deve promover o nível 4 a fonte de verdade para justificar uma regra do nível 1.

## 4. Contexto histórico importante

O projeto nasceu de um prompt no Lovable. Esse prompt inicial continha números e simplificações que foram úteis para gerar uma primeira versão visual, mas não constituem uma especificação normativa.

Erros que já apareceram no histórico:

- parâmetro de 2022 armazenado com nome de 2026;
- valor exibido pela interface diferente do valor realmente usado pela função;
- data recebida pela função e ignorada;
- alterações sucessivas na interpretação dos 18 meses;
- tentativa de obter VAAF por scraping de página externa;
- lógica de cálculo misturada com apresentação.

Ao trabalhar aqui, trate esses padrões como classes de regressão a evitar.

## 5. Mapa mental da arquitetura

### Motor FNDE — src/lib/fnde.ts

Deve conter funções puras sempre que possível:

- parâmetros anuais;
- fatores;
- valores aluno/ano;
- regra de Censo;
- regra de período;
- arredondamento;
- cálculo;
- distribuição de matrículas.

Se uma regra pode ser testada sem navegador, ela provavelmente deve estar aqui ou em outro módulo de domínio, não em index.tsx.

### Interface — src/routes/index.tsx

Responsabilidades aceitáveis:

- estado de formulário;
- seleção de modo;
- validação de entrada para UX;
- chamada às funções de domínio;
- apresentação de resultado;
- geração do PDF.

Evite colocar nova regra FNDE diretamente neste arquivo.

### Dados externos

src/lib/ibge.ts e src/lib/escola.functions.ts.

Serviços externos devem ser tratados como falíveis.

Uma indisponibilidade de IBGE/INEP não deve alterar silenciosamente a matemática do repasse.

### Parâmetros Fundeb

src/lib/vaaf.functions.ts.

A aplicação usa parâmetros versionados no projeto para comportamento determinístico. Não reintroduza scraping de HTML como fonte automática de cálculo.

## 6. Estratégia de testes

A suíte deve ser tratada como uma especificação executável.

### Camada A — unidades puras

Exemplos:

- cálculo do Dia Nacional do Censo;
- escolha do ano-base;
- período elegível;
- fatores;
- arredondamento;
- distribuição de matrículas.

### Camada B — regras anuais

Para cada exercício suportado:

- VAAF mínimo;
- quatro valores aluno/ano;
- fatores aplicáveis;
- ato/fonte registrado.

### Camada C — golden tests

Casos reais do FNDE.

Os dois casos iniciais estão documentados em docs/fnde-calculation.md.

Golden tests não devem depender da rede.

### Camada D — integração/UI

Quando adicionada, deve verificar fluxos essenciais sem duplicar todas as regras do domínio.

Prioridades:

- troca entre os dois programas;
- preenchimento mínimo válido;
- mensagens de erro;
- resultado exibido;
- PDF;
- comportamento quando serviços auxiliares falham.

## 7. Como corrigir um bug

Fluxo esperado:

1. reproduzir;
2. classificar: domínio, dado, integração ou UI;
3. encontrar a regra oficial aplicável;
4. criar/ajustar teste que falha pelo motivo correto;
5. corrigir a menor superfície possível;
6. rodar test, lint e build;
7. revisar o diff procurando mudança visual acidental;
8. documentar se a regra mudou.

Evite “corrigir no componente” um problema cuja causa está no motor.

## 8. Como adicionar um novo exercício

Nunca edite 2024/2025/2026 para transformar esses registros no ano novo.

Em vez disso:

1. localizar o ato oficial do novo exercício;
2. adicionar nova entrada em PARAMETROS_FUNDEB;
3. registrar a fonte/ato;
4. adicionar testes dos quatro valores;
5. adicionar fatores;
6. validar datas relevantes;
7. adicionar caso real de regressão quando existir;
8. manter anos anteriores imutáveis.

Isso preserva simulações históricas e torna alterações auditáveis.

## 9. Performance: onde procurar primeiro

Antes de micro-otimizar React, procure:

- chamadas de rede repetidas;
- parsing repetido de dados grandes;
- dependências carregadas cedo sem necessidade;
- operações repetidas dentro do render;
- falta de cache em dados estáveis;
- efeitos que refazem chamadas por dependências instáveis;
- geração de PDF bloqueando a interface.

Uma melhora de performance é válida quando reduz trabalho real e mantém os mesmos resultados.

## 10. Política de frontend

Estado padrão: **congelado**.

Permitido:

- corrigir elemento quebrado;
- corrigir texto factualmente errado;
- corrigir acessibilidade;
- corrigir layout que impeça uso;
- reduzir atraso/jank;
- melhorar feedback de erro/carregamento sem mudar identidade.

Não permitido sem pedido explícito:

- trocar paleta;
- refazer layout;
- trocar componentes por preferência pessoal;
- transformar o site em outro padrão visual;
- alterar fluxo apenas porque parece “mais moderno”.

## 11. Dependências

Antes de instalar pacote novo, responda:

- a dependência resolve um problema real?
- o projeto já possui ferramenta equivalente?
- isso aumenta bundle, superfície de falha ou manutenção?
- a funcionalidade pode ser implementada de forma pequena e testável sem pacote?

Prefira não adicionar dependências em correções de domínio.

## 12. PR ideal

Um PR bom para este projeto:

- explica o problema em linguagem simples;
- identifica a regra/fonte;
- lista o comportamento antes/depois;
- mostra os testes adicionados;
- informa test/lint/build;
- aponta qualquer mudança visual;
- não mistura redesign com correção de cálculo;
- não contém refatoração ampla sem necessidade.

## 13. Checklist para uma IA antes de declarar “pronto”

- [ ] Li AGENTS.md.
- [ ] Li a documentação de cálculo quando necessário.
- [ ] Não usei prompt histórico como fonte normativa.
- [ ] O bug possui teste de regressão quando aplicável.
- [ ] Golden cases continuam passando.
- [ ] Não alterei parâmetros históricos sem justificativa oficial.
- [ ] Não inventei fallback para ano sem suporte.
- [ ] Não introduzi mudança visual desnecessária.
- [ ] Rodei testes.
- [ ] Rodei lint.
- [ ] Rodei build.
- [ ] Revisei o diff.
- [ ] Atualizei docs quando a regra mudou.

## 14. Handoff mínimo para outra IA

Ao encerrar trabalho incompleto, deixe:

- branch/commit atual;
- objetivo;
- o que já foi validado;
- testes que passam/falham;
- decisão pendente;
- arquivos tocados;
- próximo passo seguro.

Evite handoffs do tipo “continue de onde parei” sem estado verificável.

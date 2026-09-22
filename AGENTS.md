<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> The upstream project desconet/capitaldesco is connected to Lovable.
> Do not rewrite published upstream history: no force push, no rebase/amend/squash
> of commits that are already published there.
>
> Work should normally happen in a feature branch or fork, pass all quality gates,
> and reach upstream through a reviewed pull request. The fork itself is not the
> production/Lovable source of truth.
<!-- LOVABLE:END -->

# AGENTS.md

This repository is designed for AI-assisted development. Treat this file as the operational contract for coding agents.

## 1. Read order before changing code

Read, in this order:

1. README.md
2. docs/ai-development.md
3. docs/fnde-calculation.md for any calculation, date, Fundeb or enrollment change
4. the relevant implementation files
5. existing tests covering the area

Do not start by editing code from a prompt-only understanding.

## 2. Product invariants

- Preserve the current frontend and visual identity by default.
- Do not redesign, reorganize screens or replace the stack unless explicitly requested.
- UI changes are allowed only to fix something broken, misleading, inaccessible or measurably inefficient.
- Correctness, reliability, performance and maintainability have priority over cosmetic refactors.
- The app is an estimator/support tool; do not silently present guessed values as official.

## 3. FNDE calculation invariants

For calculation logic, the source-of-truth order is:

1. official FNDE/Fundeb legislation and published parameters;
2. real FNDE-calculated examples;
3. regression tests;
4. implementation.

Never reverse that order.

Specifically:

- do not infer business rules from the current UI;
- do not copy values from old Lovable prompts;
- do not replace historical parameters with the latest year;
- do not make a failing golden test pass by changing the expected value unless the official reference itself was proven wrong;
- do not introduce fallback numbers for an unsupported year;
- preserve cent-level reproducibility for known FNDE examples.

Core calculation code belongs in src/lib/fnde.ts, not inside React rendering code.

## 4. Change protocol

Before editing:

- identify the user-visible problem;
- identify the authoritative rule/data source;
- find or add a test that reproduces the issue;
- make the smallest coherent implementation change.

After editing, run:

~~~bash
bun run test
bun run lint
bun run build
~~~

A change is not ready while any of these fail.

When a bug is fixed, add a regression test whenever the behavior can be expressed deterministically.

## 5. Test expectations

The suite should cover, when relevant:

- official annual parameters;
- factors and published student-year values;
- date boundaries;
- Censo Escolar boundaries;
- the 18-month cap;
- November/December behavior;
- invalid dates and invalid quantities;
- monetary rounding;
- historical-year preservation;
- Regular/Special enrollment non-duplication;
- real FNDE golden cases;
- unsupported-year behavior.

Prefer deterministic tests. Do not make core correctness depend on live external services.

## 6. Performance rules

Prefer eliminating work over hiding it behind loading states.

- Avoid network calls for static/national parameters that can be versioned safely.
- Cache stable lookup data when appropriate.
- Avoid duplicate fetches and duplicate calculations.
- Keep heavy work out of render paths.
- Do not add a dependency when a small existing utility is sufficient.
- Preserve graceful behavior when IBGE/INEP or another external service is unavailable.

Performance work must not weaken correctness.

## 7. Architecture boundaries

- src/lib/fnde.ts: pure FNDE domain logic and annual parameters.
- src/lib/vaaf.functions.ts: server access to versioned Fundeb parameters.
- src/lib/ibge.ts: locality lookup.
- src/lib/escola.functions.ts: INEP school lookup.
- src/routes/index.tsx: presentation/orchestration; avoid moving business rules here.
- tests/fnde.test.ts: deterministic domain regression suite.
- docs/fnde-calculation.md: human-readable business-rule specification.

If a new feature crosses these boundaries, keep the domain rule testable without rendering React.

## 8. Git and Lovable safety

- Never push experimental work directly to upstream main.
- Never force push the Lovable-connected upstream history.
- Prefer a fork/feature branch and a PR.
- Keep each branch in a buildable state where practical.
- Do not merge while required checks are failing.
- Before opening a PR, compare against the current upstream main to detect Lovable/user changes made in parallel.

## 9. Documentation maintenance

Update documentation in the same change when:

- a business rule changes;
- an annual parameter is added;
- a new external dependency is introduced;
- the development workflow changes;
- a new invariant would prevent future AI mistakes.

If code and docs disagree, stop and resolve the disagreement instead of guessing.

## 10. Stop conditions

Stop and ask for human input when:

- two authoritative sources conflict;
- a requested behavior is a product choice rather than an FNDE rule;
- a change would materially redesign the interface;
- a change would delete or reinterpret historical calculation data;
- production/Lovable behavior cannot be verified safely;
- an upstream change creates a merge conflict in calculation code.

Do not use human uncertainty as permission to invent a rule.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> The upstream project `desconet/capitaldesco` is connected to Lovable.
> Never rewrite published upstream history: no force-push and no rebase/amend/squash
> of commits already synchronized there.
>
> Work should normally happen in a feature branch or fork, pass all quality gates,
> and reach upstream through a reviewed pull request. A fork is not production.
<!-- LOVABLE:END -->

# AGENTS.md

Operational contract for humans and coding agents working on CapitalDesco.

## 1. Mandatory read order

Before changing code:

1. `README.md`;
2. `docs/ai-development.md`;
3. `docs/fnde-calculation.md` for any FNDE/Fundeb/date/enrollment change;
4. relevant implementation files;
5. existing tests for that area.

Do not edit from prompt-only context.

## 2. Product invariants

- Preserve the existing frontend and visual identity by default.
- Do not redesign, reorganize flows or replace the stack unless explicitly requested.
- UI changes are acceptable only to fix something broken, misleading, inaccessible or measurably inefficient.
- Correctness, reliability, performance and maintainability take priority over cosmetic refactors.
- Never present guessed parameters as official.
- Keep user-visible terminology aligned with the rule being implemented.

## 3. FNDE source-of-truth order

For calculation behavior:

1. official FNDE/Fundeb legislation and publications;
2. real FNDE-calculated evidence;
3. regression tests;
4. implementation.

Never reverse this order.

Specifically:

- do not infer a rule from the current UI;
- do not reuse numbers from old Lovable prompts as normative data;
- do not silently replace historical snapshots with a newer exercise;
- do not change a golden expected value just to make a test pass;
- do not fall back to another year when the requested year is unsupported;
- preserve cent-level reproducibility of verified cases;
- if official sources conflict or leave a material ambiguity, stop and document it.

The domain layer belongs in `src/lib/fnde.ts`; React should orchestrate and display it, not redefine it.

## 4. Change protocol

Before editing:

- define the user-visible problem;
- identify the authoritative source or verified evidence;
- reproduce the defect with a test when deterministic;
- choose the smallest coherent change.

Before declaring ready:

~~~bash
bun run test
bun run typecheck
bun run lint
bun run build
~~~

All four must pass.

## 5. Testing expectations

Add coverage where relevant for:

- annual Fundeb snapshots;
- factors and published student-year values;
- Censo Escolar boundary dates;
- month counting and 18-month cap;
- November/December behavior;
- invalid chronology and malformed dates;
- monetary rounding;
- unsupported years;
- manual VAAF override behavior;
- Regular/Special non-duplication;
- real FNDE golden cases;
- cache/failure behavior of external lookups.

Core correctness tests must not depend on live external services.

## 6. Performance rules

Prefer removing work to hiding it behind a spinner.

- Static/national calculation parameters should not require a live network request.
- Cache stable lookup data where safe.
- Avoid duplicate fetches and stale async responses.
- Keep business math out of render-time ad hoc code.
- Do not add dependencies without a concrete benefit.
- External IBGE/INEP failures must not silently alter repasse math.

Performance improvements must preserve numerical correctness.

## 7. Architecture boundaries

- `src/lib/fnde.ts`: deterministic FNDE domain logic + supported Fundeb snapshots.
- `src/lib/ibge.ts`: locality lookup and cache.
- `src/lib/escola.functions.ts`: INEP school lookup.
- `src/routes/index.tsx`: form state, orchestration, rendering and PDF.
- `tests/fnde.test.ts`: domain regression/golden suite.
- `tests/ibge.test.ts`: locality integration behavior with mocked network.
- `docs/fnde-calculation.md`: human-readable calculation specification.
- `docs/ai-development.md`: development/handoff protocol.

If a new rule can be tested without React, keep it out of the route component.

## 8. Git and Lovable safety

- Never push experimental changes to upstream `main`.
- Never force-push Lovable-connected published history.
- Prefer fork/feature branch → quality gates → PR → review → merge.
- Before PR/merge, compare against current upstream `main`.
- If upstream changed concurrently, reconcile first; do not overwrite it.
- Do not merge while a required check is red.

## 9. Documentation maintenance

Update docs in the same change when:

- a calculation rule or assumption changes;
- a Fundeb snapshot changes;
- an integration/dependency changes;
- the quality workflow changes;
- a newly discovered invariant would prevent future mistakes.

If code, tests and docs disagree, stop and resolve the disagreement rather than choosing one silently.

## 10. Stop conditions

Ask for human/product input when:

- two authoritative sources materially conflict;
- behavior is a product choice rather than an FNDE rule;
- a change would materially redesign the interface;
- historical data would need reinterpretation/deletion;
- a known regulatory exception needs input the UI does not collect;
- production/Lovable behavior cannot be safely verified;
- upstream changes conflict with calculation code.

Do not use uncertainty as permission to invent a rule.

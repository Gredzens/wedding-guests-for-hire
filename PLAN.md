# Wedding Guests for Hire Implementation Plan

## Milestone 1 Specification and safety

- [x] Read Master Build Prompt completely.
- [x] Extract and visually inspect the entire nine-page homework, all tables, appendices, and links.
- [x] Create protective `.gitignore`, `.env.example`, `PROMPT.md`, `PLAN.md`, and `STATUS.md`.
- [ ] Inspect runtimes, auth state, repository state, and private configuration by presence only.

Acceptance: authoritative requirements are durable; secrets cannot enter normal Git/build paths.

## Milestone 2 Domain and automated tests

- [ ] Define shared types, money/rounding, authorization, validation, state transitions, idempotency, and result calculations.
- [ ] Implement in-memory repositories and fake Sheets/Telegram adapters.
- [ ] Cover Test 1 and cumulative Test 2 results plus every required negative/integration case.

Validation: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`.

## Milestone 3 Persistence and application services

- [ ] Add reproducible Supabase migrations, constraints, transactional decision functions, and repeatable five-employee seed.
- [ ] Implement Supabase repositories and server-only clients.
- [ ] Implement delivery jobs/status and retry orchestration outside financial transactions.
- [ ] Implement deterministic Google Sheets upserts and Telegram sending.

Validation: integration tests against fakes and database contract checks.

## Milestone 4 Website and Telegram

- [ ] Build accessible responsive dashboard, role forms, personal records, manager decisions, links, link management, and retry/failure states.
- [ ] Add secure Telegram webhook and guided stateful workflows.
- [ ] Verify server-side authorization and adapter-equivalent outcomes.

Validation: lint, typecheck, unit/integration tests, focused browser tests, production build.

## Milestone 5 Live infrastructure

- [ ] Initialize Git; scan secrets; commit; create and push public GitHub repository.
- [ ] Apply Supabase migration and seed; prove sales/expenses empty.
- [ ] Initialize Sales/Expenses headers and prove no financial rows.
- [ ] Create/configure/deploy Vercel production with encrypted environment variables.
- [ ] Configure secured Telegram webhook and verify `getWebhookInfo`.
- [ ] Verify public page and all links; scan tracked files and Git history again.

## Milestone 6 Manual test handoff

- [ ] Record exact commands/evidence, safe configuration status, URLs, known limitations, and Test 1/Test 2 runbook in `STATUS.md`.
- [ ] Confirm no S01-S05 or E01-E07 exist anywhere live.
- [ ] Stop before Patriks performs the first Test 1 action.

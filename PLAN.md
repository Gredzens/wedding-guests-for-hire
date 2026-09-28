# Wedding Guests for Hire Implementation Plan

## Milestone 1 Specification and safety

- [x] Read Master Build Prompt completely.
- [x] Extract and visually inspect the entire nine-page homework, all tables, appendices, and links.
- [x] Create protective `.gitignore`, `.env.example`, `PROMPT.md`, `PLAN.md`, and `STATUS.md`.
- [x] Inspect runtimes, auth state, repository state, and private configuration by presence only.

Acceptance: authoritative requirements are durable; secrets cannot enter normal Git/build paths.

## Milestone 2 Domain and automated tests

- [x] Define shared types, money/rounding, authorization, validation, state transitions, idempotency, and result calculations.
- [x] Implement fake delivery tracking and deterministic integration helpers.
- [x] Cover Test 1 and cumulative Test 2 results plus core negative/integration cases.

Validation: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`.

## Milestone 3 Persistence and application services

- [x] Add reproducible Supabase migrations, constraints, atomic reference claims, immutable origin, and repeatable five-employee seed.
- [x] Implement Supabase repositories and server-only clients.
- [x] Implement delivery status and retry orchestration outside financial transactions.
- [x] Implement deterministic Google Sheets upserts and Telegram sending.

Validation: integration tests against fakes and database contract checks.

## Milestone 4 Website and Telegram

- [x] Build accessible responsive dashboard, role forms, personal records, manager corrections/decisions, links, link management, and retry/failure states.
- [x] Add secure Telegram webhook and guided stateful workflows.
- [x] Verify server-side authorization, shared application services, empty-state browser behavior, and mobile layout.

Validation: lint, typecheck, unit/integration tests, focused browser tests, production build.

## Milestone 5 Live infrastructure

- [x] Initialize Git; scan secrets; commit; create and push public GitHub repository.
- [x] Apply Supabase migrations and seed; prove sales/expenses empty.
- [x] Initialize Sales/Expenses headers and prove no financial rows.
- [x] Create/configure/deploy Vercel production with encrypted environment variables.
- [x] Configure secured Telegram webhook and verify `getWebhookInfo`.
- [x] Verify public page and all links; scan tracked files and Git history again.

## Milestone 6 Manual test handoff

- [x] Record exact commands/evidence, safe configuration status, URLs, known limitations, and Test 1/Test 2 runbook in `STATUS.md`.
- [x] Confirm no S01-S05 or E01-E07 exist anywhere live.
- [x] Stop before Patriks performs the first Test 1 action.

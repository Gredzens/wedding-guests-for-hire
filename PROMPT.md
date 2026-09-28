# Wedding Guests for Hire Build Specification

## Authority and objective

Build the complete Friends Included finance system for Patriks Gredzens (`pg25032`) from the authoritative homework file `C:\Users\Patriks\Desktop\GG\Day 4 Homework - Wedding Guests for Hire.docx` and the Master Build Prompt. The source document has been read in full, including all nine rendered pages, twelve tables, four external links, appendices, test data, expected results, and failure conditions.

This run ends immediately before Patriks begins manual Test 1. It must not create S01-S05 or E01-E07, submit the course spreadsheet, edit anyone else's course data, or claim that manual Telegram notifications were observed.

## Fixed decisions

- Public identity: Patriks Gredzens, student ID pg25032.
- English-only website and Telegram messages.
- Store time in UTC; display Europe/Riga time.
- Next.js App Router, TypeScript, npm, Vercel.
- Supabase project Gredzens Project is the source of truth.
- Telegram bot: `@WeddingFinance222bot`.
- Google Sheet ID: `1ke50QgIIbhbRLYceM1CWJAyRBA0rwUquu4OY2fGUqFU`, with `Sales` and `Expenses` tabs.
- Public GitHub repository: `wedding-guests-for-hire`.
- Visual design: responsive professional financial dashboard using ivory, muted rose, and dark burgundy; accessible contrast, keyboard usability, legible tables and mobile layouts.

## Security boundaries

- Never commit, display, log, summarize, or expose secrets, private keys, tokens, database passwords, or private configuration.
- Keep all mutations server-side and pass website and Telegram inputs through the same domain/application services.
- A Supabase publishable key and project URL may be public; the Supabase secret, Telegram token/webhook secret, and Google private key must remain server-only.
- Validate Telegram's webhook secret header.
- Keep `.env*`, Vercel metadata, build output, logs, coverage, and credential JSON files untracked. Commit only `.env.example` with empty values.
- Scan tracked files and Git history before every push.
- Preserve Google service-account Editor and link Viewer permissions; never enable public editing.

## Roles and authorization

- Demonstration selector: Svetlana de Monte Carlo, Richard Darling, Anastasia Ferrari, Jean-Claude Bērziņš, Kevin von Whatever. No website login is required.
- Richard, Anastasia, and Jean-Claude may submit sales with proposed splits and see only their own submissions and statuses.
- Kevin may submit expenses with proposed allocations and see only his submissions and statuses.
- Svetlana sees all transactions/results, manages Telegram links, approves or corrects sales splits, and decides expense allocations.
- Enforce permissions in server-side processing, not only UI visibility.
- Telegram actors are resolved from manager-controlled Telegram user links. Unlinked users cannot submit or self-assign roles.
- Preserve the original employee and Telegram chat on each submission even after later relinking.

## Financial rules

- Euros only, positive amounts, no VAT/tax, two-decimal display.
- A new sale is pending, appears in records, and contributes zero approved income and commission.
- Commission pool is 10% of sale amount. Each percentage is 0-100 and all three total exactly 100.
- Round pool and each commission to cents. Assign any remainder to the largest percentage; ties resolve Richard, then Anastasia, then Jean-Claude.
- Approved commission is an automatic expense of the sale's project and is never entered as an ordinary expense.
- Every saved expense immediately reduces company result.
- Company overhead allocates automatically. A project expense remains awaiting allocation and affects company result but no project until Svetlana decides.
- Allocation approval never deducts the expense from company result a second time.
- Preserve original proposals and final decisions. Corrections occur before approval; approved edits are not required.
- Duplicate requests, retries, approvals, webhook redelivery, and external retries must never duplicate transactions, commissions, expenses, Sheet rows, notifications, or totals.
- Project result = approved project sales - project commission expense - expenses allocated to that project.
- Company result = all approved sales - all commission expense - all recorded expenses.

## Persistence and integrations

- Reproducible Supabase migrations define employees, Telegram links, sales, expenses, delivery/sync state, idempotency, constraints, and transaction-safe decision functions.
- Seed exactly five fictional employees repeatably.
- Financial commits are independent of Sheets/Telegram side effects. Record safe status, attempts, timestamps, retry state, and errors.
- Google Sheets performs deterministic upsert by reference. Pending sales show no approved split and zero earned commission. Proposed/final fields stay separate.
- Telegram uses a secured HTTPS webhook, `/start`, guided field-by-field role-specific conversations, buttons where practical, explicit validation, and persistence-before-confirmation.
- Decisions notify the original submitting chat, or for website records the currently linked employee chat if available. Missing recipients are explicit and retryable.

## Website deliverables

- Name/student ID, concise instructions, role selector, role-appropriate forms, personal statuses, manager area, delivery retries/failures, and Telegram-link management.
- Dashboard: approved income, commission expense, allocated expenses and result per project; company overhead; awaiting allocation; total company result; each salesperson's commission.
- Links to Telegram, Google Sheet, and public GitHub repository.
- Explicit loading, empty, validation, success, retry, and failure states.
- Results derive only from persisted data and respond to instructor-entered transactions.

## Verification

Pass formatting, lint, TypeScript, unit/integration tests, and production build. Automated coverage includes both homework datasets and expected totals, rounding/ties, validation, authorization, duplicates, repeated approval, webhook redelivery, immutable origin, Sheets retry/upsert, notification failure/retry, and equivalent website/Telegram outcomes. Browser tests must not pollute live data.

## Live readiness and stop condition

Before handoff: migrations applied, five employees seeded, live sales/expenses empty, correct empty Sheet tabs, public secret-free GitHub repository, reachable Vercel deployment with encrypted environment variables, secured active Telegram webhook, and verified public links. `STATUS.md` must contain evidence and an exact manual Test 1/2 runbook.

## Documented discrepancy

The homework's ultimate submission state says the public page should show completed Test 1 and Test 2 results. The Master Build Prompt and the user's active Goal explicitly prohibit entering those records in this run and require an empty pre-Test-1 handoff. This run therefore delivers a fully functional empty system for Patriks to populate manually; no supplied totals are hard-coded.

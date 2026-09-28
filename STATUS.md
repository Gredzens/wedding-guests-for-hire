# Wedding Guests for Hire Status

## Current state

Implementation, local/live-data verification, and public GitHub publication are complete. No application transactions have been entered and no course submission has been made. Vercel deployment is waiting for the user to complete the visible interactive Vercel account sign-in; credentials are not requested or exposed.

## Completed evidence

- Master Build Prompt read completely from the specified build-package Markdown file.
- Homework structurally extracted: 151 paragraphs, 12 tables, four external hyperlinks, one section, no inline images.
- Homework rendered through Microsoft Word to a nine-page PDF after the packaged renderer reported no bundled LibreOffice executable. All nine page images were visually inspected; tables, headings, formulas, appendices, and links are legible and complete.
- Private environment handoff exists and contains all six named variables. Values were not printed. The configured Google service-account JSON path currently does not resolve to a file; this may block only the live Sheets credential step after all independent work is complete.
- The private Google service-account path was revalidated successfully; the JSON is a service-account credential with client email, project ID, and private key fields. Values remain undisclosed.
- Supabase migration was applied through the signed-in project SQL editor and verified with exactly 5 employees, 0 sales, and 0 expenses.
- Google Sheet tabs `Sales` and `Expenses` were verified, initialized with readable headers, frozen header rows, deliberate widths, and zero transaction rows. Native browser screenshots were visually checked.
- Production build completed successfully. Formatting, lint, TypeScript, and the current domain test suite pass.
- Current automated suite: 3 files, 10 tests passing. It covers both prescribed datasets, negative validation/permissions, deterministic rounding and tie order, repeated decisions, tracked delivery failure/retry, deterministic Sheets row updates, and preservation of the original Telegram recipient.
- Local browser verification passed against the live empty Supabase project: manager and employee role views load, no console errors were observed, and a 390 px viewport had no page-level overflow.
- Manager commission correction, integration attempt history/retry controls, Telegram validation recovery, and Telegram redelivery recovery were added.
- Git repository initialized on `main`, tracked files secret-scanned with zero matches, initial commit `42f9c83` created, and verified hardening checkpoint `243bbf8` committed.
- Supabase integrity migration applied live. Verification returned 5 employees, 0 sales, 0 expenses, 0 claimed financial references, 4 integrity triggers, and 2 decision-consistency constraints.
- Protective `.gitignore` and empty-value `.env.example` created before dependencies or application code.

## Decisions

- Monetary values will use integer cents, never floating-point arithmetic.
- A shared domain/application layer will serve both website and Telegram adapters.
- External delivery happens after durable financial persistence and records explicit retry state.
- Current handoff target is an empty live system before manual Test 1, despite the homework's later final-submission state requiring completed Test 1/2 data.

## Live resources

- Google Sheet: https://docs.google.com/spreadsheets/d/1ke50QgIIbhbRLYceM1CWJAyRBA0rwUquu4OY2fGUqFU/edit
- Telegram: https://t.me/WeddingFinance222bot
- GitHub: https://github.com/Gredzens/wedding-guests-for-hire (public, `main` at `9d1a126` when first verified)
- Vercel: pending
- Supabase: live schema and integrity upgrade verified; transaction tables empty

## Current blocker assessment

Vercel requires an interactive account sign-in before its official CLI can be authorized. The sign-in page is open in the visible Codex browser and the CLI is waiting on device authorization. Minimum user action: complete that sign-in without sharing credentials, then tell Codex it is done.

## Exact next action

After Vercel sign-in: finish the waiting CLI authorization, deploy/configure Vercel with encrypted environment variables, configure and verify the secured Telegram webhook, then perform final public-link and empty-table checks before the manual Test 1 handoff.

## Manual test runbook

To be completed verbatim from the homework after live readiness is proven. Do not begin Test 1 yet.

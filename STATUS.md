# Wedding Guests for Hire Status

## Handoff state

The system is deployed, and Patriks Gredzens completed manual Tests 1 and 2 on September 29, 2026. The production records, dashboard totals, Telegram notifications/retry behavior, and Google Sheet rows were verified. The course spreadsheet has not been submitted, and no credentials were exposed.

## Live resources

- Application: https://wedding-guests-for-hire-phi.vercel.app
- Telegram: https://t.me/WeddingFinance222bot
- Google Sheet: https://docs.google.com/spreadsheets/d/1ke50QgIIbhbRLYceM1CWJAyRBA0rwUquu4OY2fGUqFU/edit
- GitHub: https://github.com/Gredzens/wedding-guests-for-hire
- Supabase: Gredzens Project; committed migrations applied and integrity upgrade verified

## Completed evidence

- Read the Master Build Prompt and the complete nine-page homework, including its tables, appendices, hyperlinks, tests, expected results, and failure cases.
- Implemented one shared TypeScript domain/application layer for website and Telegram validation, permissions, accounting, rounding, decisions, idempotency, and retry behavior.
- Implemented the responsive manager/employee dashboard, role-specific forms, approvals and corrections, Telegram linking, personal status views, delivery failures, and retry controls.
- Implemented reproducible Supabase migrations, atomic reference claims, immutable transaction origin, decision constraints, four integrity triggers, and a repeatable five-employee seed.
- Verified the pre-Test-1 live database had exactly five employees and no transaction records before Patriks began manual entry.
- Initialized the live Google Sheet tabs `Sales` and `Expenses` with readable headers and no transaction rows before manual testing.
- Published the public GitHub repository and connected it to the Vercel project for deployments.
- Configured Vercel production variables through encrypted environment storage. No credential values appear in tracked files or documentation.
- Deployed production successfully. The public page returns HTTP 200, displays Patriks Gredzens and `pg25032`, and links to the reachable Telegram bot, Google Sheet, and GitHub repository.
- Registered the secured Telegram webhook at the production HTTPS endpoint. Telegram `getMe` identifies `WeddingFinance222bot`; `getWebhookInfo` reports the expected URL, zero pending updates, and no last error.
- Final local checks passed: Prettier formatting, ESLint, TypeScript, 3 test files/10 tests, and the Next.js 16.3.6 production build.
- Automated tests cover both supplied datasets, invalid/unauthorized operations, deterministic rounding and tie order, duplicate/repeated decisions, Telegram redelivery, recipient preservation, and Sheets/Telegram failure and retry behavior.
- Corrected the website's percentage inputs so valid zero-percent shares such as S02's `0/50/50` proposal are accepted while monetary inputs still require positive amounts.
- Repaired the immutable-origin database trigger with table-specific branches after live Test 1 exposed rejected manager updates, and made structured database errors visible instead of the generic `Request failed` message.
- Simplified the manager Telegram setup for a single saved account: once linked, Svetlana can switch the bot between fictional employees with one selector instead of re-entering the Telegram user and chat IDs.
- Completed both production manual datasets. Final cumulative results were verified as Project A €2,050, Project B €2,180, company €3,930, Richard €140, Anastasia €175, Jean-Claude €215, and total commission €530; S05 remained pending and E07 remained awaiting allocation.
- Completed the negative checks: invalid splits, unauthorized approval and sale submission, zero/missing expense amounts, duplicate references, and repeated approval were rejected or treated as a no-op without changing records or totals.
- Verified live Telegram failure visibility and retry using S04, and Patriks confirmed the final Google Sheet rows reconcile with the application.

## Known manual boundary

- The bot recipient must first open the Telegram link and press **Start**.
- S02 retains the expected visible `No Telegram recipient linked` delivery failure because no Anastasia recipient was linked when it was approved; this does not affect the saved decision or financial results.
- The course spreadsheet has not been submitted; submission remains a separate user-controlled action.

## Manual Test 1 — normal operation

1. Open the Telegram bot, press **Start**, and note your numeric Telegram user ID.
2. Open the live application as Svetlana. In manager setup, link your Telegram user ID to Richard.
3. In Telegram as Richard, submit sale S01: customer `Olivia Rose`; description `One proud uncle and an emotional grandmother`; project A; amount €1,000; proposed Richard/Anastasia/Jean-Claude split 50/30/20%.
4. In the Svetlana manager setup, change that same Telegram link from Richard to Kevin. Do not alter S01; it must retain Richard and the original chat as its notification owner/destination.
5. In Telegram as Kevin, submit expense E01: `Rented suit and fake pearl necklace for the relatives`; category Materials; amount €120; proposed allocation A.
6. On the website as Anastasia, submit sale S02: customer `Daniel King`; description `University friends, dancing, and the stripping performance`; project B; amount €2,000; proposed split 0/50/50%.
7. On the website as Kevin, submit E02: `Taxi for the grandmother; Kevin selected the wrong project`; category Travel; amount €80; proposed allocation B.
8. On the website as Kevin, submit E03: `Monthly company website subscription`; category Other; amount €100; Company overhead.
9. Before manager decisions, verify S01/S02 are pending; E01/E02 await allocation; E03 is overhead; approved income and commission expense are €0; both project results are €0; company result is −€300.
10. As Svetlana, approve S01 unchanged; change S02 to 20/40/40% and approve; approve E01 to A; change E02 from B to A and approve.
11. Verify Telegram delivers the S01 approval and E01 allocation to the original chat despite the role relink. For S02/E02, use a linked recipient if available; otherwise verify the record says `No Telegram recipient linked`.
12. Verify final results: Project A €700; Project B €1,800; company €2,400; Richard €90; Anastasia €110; Jean-Claude €100; total commission €300.
13. Inspect the actual Sales/Expenses Sheet rows, including corrected S02 split and E02 allocation. Refresh the website and confirm persistence before Test 2.

## Manual Test 2 — cumulative additions

1. Keep all Test 1 records. Submit all Test 2 entries through the website using the named demonstration roles.
2. As Jean-Claude, submit S03: customer `Emma Stonebridge`; description `Premium relatives, including an uncle presented as a surgeon`; project A; €1,500; split 40/40/20%.
3. As Richard, submit S04: customer `Lucas Green`; description `Small group of loud university friends`; project B; €800; split 25/25/50%.
4. As Richard, submit S05: customer `Mia Brooks`; description `Extra guests and an embarrassing speech`; project B; €600; split 100/0/0%.
5. As Kevin, submit E04: `Replacement costumes after an enthusiastic dance performance`; Materials; €250; proposed B.
6. As Kevin, submit E05: `Minibus for university friends; Kevin selected the wrong project again`; Travel; €90; proposed A.
7. As Kevin, submit E06: `Company telephone subscription`; Other; €60; Company overhead.
8. As Kevin, submit E07: `Emergency replacement clothing; project allocation still needs checking`; Materials; €140; proposed A.
9. Before decisions, link Jean-Claude to your Telegram account for the S03 notification. Link Kevin before approving E04/E05. Earlier bot submissions must retain their original notification destinations.
10. As Svetlana, change S03 to 20/30/50% and approve; approve S04 unchanged; leave S05 pending; approve E04 to B; change E05 from A to B and approve; leave E07 awaiting allocation.
11. Verify S03 reports a €150 pool: Richard €30, Anastasia €45, Jean-Claude €75, and indicates the changed split. Verify E05 reports €90 moved from A to B. S05/E07 must produce no approval notification.
12. Verify cumulative results: Project A €2,050; Project B €2,180; company €3,930; Richard €140; Anastasia €175; Jean-Claude €215; total commission €530. S05 remains €600 pending, and E07 remains €140 awaiting allocation but is already included in company expenses.
13. Verify reconciliation: €2,050 + €2,180 − €160 overhead − €140 awaiting allocation = €3,930.
14. Exercise the required negative checks: reject 60/30/20%; deny Richard approval; deny Kevin sale entry; reject missing/zero expense amounts; make repeated approval a no-op; reject duplicate references. Control totals must remain unchanged.
15. With Codex assistance, test an interrupted Sheets update and failed Telegram delivery: the transaction/decision must remain saved, failure must be visible and retryable, retry must update the same row, and financial totals must not change.

## Exact next action

Open https://t.me/WeddingFinance222bot, press **Start**, then obtain your numeric Telegram user ID so Svetlana can link it to Richard before S01.

# Wedding Guests for Hire

A responsive finance workflow for the Friends Included Ltd homework scenario. The application provides one shared set of accounting and authorization rules across a Next.js website and a Telegram bot, with Supabase as the source of truth and deterministic Google Sheets synchronization.

## Features

- Role-specific sale and expense entry for five fictional employees
- Manager approval, commission correction, expense allocation, and Telegram linking
- Cent-accurate project/company results and deterministic commission rounding
- Secured, idempotent Telegram webhook with guided conversations
- Retryable Google Sheets and Telegram delivery tracking
- Reproducible Supabase migrations and repeatable employee seed

## Local verification

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Copy `.env.example` to a locally ignored environment file and populate it with your own server-side credentials. Never commit credential values or Google service-account JSON.

## Public resources

- [Live application](https://wedding-guests-for-hire-phi.vercel.app)
- [Telegram bot](https://t.me/WeddingFinance222bot)
- [View-only Google Sheet](https://docs.google.com/spreadsheets/d/1ke50QgIIbhbRLYceM1CWJAyRBA0rwUquu4OY2fGUqFU/edit)
- [Public GitHub repository](https://github.com/Gredzens/wedding-guests-for-hire)

Built by Patriks Gredzens (`pg25032`).

# Cash Control Method

Cash Control is an accounting-first personal finance recordkeeping app for
college students. It uses one transaction ledger to calculate cash,
liabilities, net financial position, and weekly/monthly reports.

The current experience includes guided first-time setup, a connected monthly
plan, category budgets, required-payment reminders, savings goals,
budget-versus-actual comparisons, and separate weekly and monthly reviews.
See [PRODUCT_VISION.md](./PRODUCT_VISION.md) for the product principles and
decision framework.

## Run it locally

In Terminal, from this project folder:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Next.js refreshes the
page as files are saved in VS Code. Stop the server with `Control + C`.

## Verify changes

```bash
npm test
npm run lint
npm run build
```

## Data and privacy

The current version stores data in the browser's `localStorage` under the
versioned key `cash-control-accounting:v1`. Records are specific to that browser
and device. There are no accounts, cloud backups, or bank connections yet. Use
the sample-data button to explore the app without making sample records the
default.

## Accounting model

- Income/funding raises cash and is reported as income.
- Cash expenses lower cash; credit purchases raise a liability.
- Borrowing raises cash and a liability but is not income.
- Debt payments lower cash by principal plus interest, lower the liability by
  principal, and treat interest as an expense.
- Transfers move money between cash accounts without changing total cash.
- Pending transactions stay in the ledger but do not affect balances or reports.

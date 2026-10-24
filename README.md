# Cash Control Method

Cash Control is an accounting-first personal finance recordkeeping app for
college students. It uses one transaction ledger to calculate cash,
liabilities, net financial position, and weekly/monthly reports.

The current experience includes guided first-time setup, a connected monthly
plan, a before-payday safe-to-spend guardrail, category budgets with natural
daily/weekly/monthly/semester timing, required-payment reminders, savings
goals, restricted meal-plan balances, budget-versus-actual comparisons, and
separate daily, weekly, and monthly reviews.
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
and device. Use **Export backup** to download a validated JSON copy and **Import
backup** to restore it. Imports are checked before current records are replaced,
and unrecognized stored data is not overwritten automatically. There are no
accounts, cloud backups, or bank connections yet. Use the sample-data button to
explore the app without making sample records the default.

## Planning model

- Expected monthly income is reduced by income already received, preventing it
  from being counted again inside current cash.
- Required payments supplement category budgets only when the budget does not
  already cover them.
- Goal contributions supplement planned savings only when they are higher, and
  posted transfers into savings reduce the amount still to save.
- Safe to spend uses cash currently available and protects recorded bills due
  before the next expected income, pending cash outflows, unfinished savings,
  and the selected cash cushion. It falls back to month-end when no future
  income date is saved.
- Weekly grocery, dining, transportation, and other flexible amounts remain
  weekly in the interface and are normalized with `52 ÷ 12` only when a monthly
  comparison needs them.

## Meal plans

Meal-plan value is tracked separately from cash that can be spent anywhere.
Funding a declining-balance plan moves value from cash or a liability into a
restricted meal-plan balance; it is not counted as a food expense at that
moment. Recording meal-plan use reduces the restricted balance and recognizes
groceries or dining-out spending without reducing cash a second time. Swipe
and unlimited plans can also be listed for coverage context, while monetary
usage recording remains optional.

## Accounting model

- Income/funding raises cash and is reported as income.
- Cash expenses lower cash; credit purchases raise a liability.
- Borrowing raises cash and a liability but is not income.
- Debt payments lower cash by principal plus interest, lower the liability by
  principal, and treat interest as an expense.
- Transfers move money between cash accounts without changing total cash.
- Pending transactions stay in the ledger but do not affect balances or reports.

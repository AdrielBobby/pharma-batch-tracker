# Normalization Notes

## 1NF
All attributes are atomic — e.g. no comma-separated medicine lists inside a
supplier row, no repeating batch columns inside `Medicines`. Each row has a
unique key (`*_id`).

## 2NF
Every non-key attribute depends on the *whole* primary key. This matters
mainly for `Batches` and `Sales`, which could otherwise be tempted to key on
a composite (e.g. `medicine_id + batch_number`). Instead each has its own
surrogate key (`batch_id`, `sale_id`), so partial-key dependency isn't
possible in the first place.

## 3NF
No transitive dependencies:
- `Medicines.manufacturer` describes the medicine, not the batch — kept out
  of `Batches`.
- `Suppliers` contact info lives only in `Suppliers`, referenced from
  `Batches` by `supplier_id` rather than duplicated per batch.
- `Sales.total_amount` is derived (`quantity_sold * unit_price`) — arguably
  a denormalization for convenience; document this as an intentional
  trade-off if a reviewer asks, or compute it in a view instead of storing
  it if strict 3NF is required.

## Why batches are their own entity

A naive design might put `expiry_date` and `quantity` directly on
`Medicines`. That breaks as soon as a medicine is restocked before the old
stock sells out — you'd need multiple expiry dates for one medicine. Splitting
out `Batches` (medicine + supplier + lot-specific expiry/quantity) is the
key normalization decision in this schema and is what makes FEFO
(first-expiry-first-out) tracking and per-lot alerts possible.

# Test Cases

| # | Test | Expected result |
|---|---|---|
| 1 | Add supplier | Row inserted into `SUPPLIER` |
| 2 | Edit supplier | Master data changes without affecting purchase history |
| 3 | Delete unused supplier | Row is deleted |
| 4 | Delete supplier referenced by purchase | Rejected by foreign-key protection |
| 5 | Add medicine | Row inserted into `MEDICINE` |
| 6 | Edit medicine | Catalogue data changes; batch history remains linked |
| 7 | Delete unused medicine | Row is deleted |
| 8 | Delete medicine with batches | Rejected by foreign-key protection |
| 9 | Record purchase with new batch | `PURCHASE`, `PURCHASE_ITEM`, `MEDICINE_BATCH` inserted; stock increases |
| 10 | Record purchase for existing batch | Existing batch stock increases |
| 11 | Invalid purchase subtotal by direct SQL | Check constraint rejects the line |
| 12 | Update purchase line quantity | Batch stock changes by exactly the quantity delta |
| 13 | Delete an unconsumed purchase line | Received quantity is removed from stock |
| 14 | Delete/reduce purchase below already-consumed stock | Trigger rejects operation |
| 15 | Sell medicine with enough stock | Earliest eligible batch is selected and stock deducted |
| 16 | Sell quantity spanning two batches | Earlier batch is depleted before later batch allocation |
| 17 | Sell greater than total eligible stock | API rejects sale and rolls back the entire transaction |
| 18 | Direct sale from expired batch | Trigger raises `Expired batch cannot be sold` |
| 19 | Update/delete sale line by direct SQL | Stock is correctly reconciled/restored |
| 20 | Header totals after item insert/update/delete | `PURCHASE.TOTAL_AMOUNT`/`SALE.TOTAL_AMOUNT` remain equal to detail totals |
| 21 | Generate expiry alerts twice | No duplicate active alert for the same batch/type |
| 22 | Resolve active alert | Status becomes `RESOLVED` |
| 23 | Near-expiry view | Shows positive-stock batches expiring in 0–30 days |
| 24 | Low-stock view | Shows medicine totals below reorder level |
| 25 | Concurrent sale candidate selection | `FOR UPDATE` locks eligible batches until transaction completes |
| 26 | FEFO unit tests | All three Node tests pass |
| 27 | Frontend production build | `npm run build` completes with zero TypeScript/Vite errors |

## Automated backend unit test

```bash
cd backend
npm test
```

## Database reconciliation checks

After installing the database, run:

```sql
@database/07_validation.sql
```

The header/detail mismatch queries and negative-stock query must return no rows.

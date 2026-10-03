# ER Model

```mermaid
erDiagram
  CATEGORY ||--o{ MEDICINE : classifies
  MEDICINE ||--o{ MEDICINE_BATCH : has
  SUPPLIER ||--o{ PURCHASE : supplies
  PURCHASE ||--|{ PURCHASE_ITEM : contains
  MEDICINE_BATCH ||--o{ PURCHASE_ITEM : received_as
  CUSTOMER ||--o{ SALE : makes
  SALE ||--|{ SALE_ITEM : contains
  MEDICINE_BATCH ||--o{ SALE_ITEM : sold_from
  MEDICINE_BATCH ||--o{ ALERT : raises
```

## Simplest explanation
- `MEDICINE` stores product identity.
- `MEDICINE_BATCH` stores expiry date and current quantity because those change per batch.
- `PURCHASE/PURCHASE_ITEM` store purchase history.
- `SALE/SALE_ITEM` store sales history and preserve which batch was sold.
- `ALERT` stores expiry warnings for a batch.

# ER Diagram

```mermaid
erDiagram
    SUPPLIERS ||--o{ BATCHES : supplies
    MEDICINES ||--o{ BATCHES : "has lot"
    BATCHES ||--o{ SALES : "sold from"
    BATCHES ||--o{ EXPIRY_ALERTS : "flagged by"

    SUPPLIERS {
        int supplier_id PK
        string name
        string contact_person
        string phone
        string email
        string address
    }

    MEDICINES {
        int medicine_id PK
        string name
        string category
        string unit
        string manufacturer
    }

    BATCHES {
        int batch_id PK
        int medicine_id FK
        int supplier_id FK
        string batch_number
        date manufacture_date
        date expiry_date
        int quantity_received
        int quantity_available
        decimal purchase_price
        date received_date
    }

    SALES {
        int sale_id PK
        int batch_id FK
        int quantity_sold
        decimal unit_price
        decimal total_amount
        date sale_date
        string customer_name
    }

    EXPIRY_ALERTS {
        int alert_id PK
        int batch_id FK
        date alert_date
        string alert_type
        string message
        boolean resolved
    }
```

## Relationships

- One **supplier** supplies many **batches**.
- One **medicine** has many **batches** (each restock is a distinct batch with its own expiry).
- One **batch** can be sold across many **sales** rows (partial sales over time).
- One **batch** can generate many **expiry alerts** (e.g. 90/30/7-day warnings).

## Design notes

- `Batches.quantity_available` is derived/maintained via trigger on `Sales`
  insert, rather than recomputed from `Sales` each time — trade-off of
  redundancy for read performance, kept consistent by the trigger.
- Expiry status itself is not stored as a column; it's derived from
  `expiry_date` vs `CURRENT_DATE` in views/queries, so it's never stale.

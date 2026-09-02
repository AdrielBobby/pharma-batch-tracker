# Pharmacy Expiry and Batch Monitoring

DBMS mini project: track medicine batches, expiry dates, suppliers, and sales,
with a normalized inventory schema and stored-procedure/trigger-based expiry
alerts.

## Structure

```
docs/
  er-diagram.md         ER diagram (Mermaid) and entity/relationship notes
  normalization.md      1NF/2NF/3NF walkthrough for the schema
sql/
  01_schema.sql          Table definitions (DDL) + constraints
  02_triggers_procedures.sql  Stock updates, expiry alert triggers/procedures
  03_views.sql           Reporting views (expiring soon, out of stock, etc.)
  04_sample_data.sql     Seed data for demoing the schema
  05_queries.sql         Example analytical queries / report queries
<<<<<<< HEAD
frontend/
  src/                   Responsive React + TypeScript stock-desk interface
  .env.example           API connection settings
docs/
  demo-flow.md           Final examiner demonstration sequence
  test-cases.md          Frontend and integration test plan
=======
>>>>>>> origin/main
```

## Core entities

- **Suppliers** — vendors medicines are purchased from
- **Medicines** — drug catalog (name, category, manufacturer)
- **Batches** — a specific received lot of a medicine (expiry date, quantity, supplier)
- **Sales** — units sold out of a specific batch
- **ExpiryAlerts** — log of alerts raised for near-expiry / expired batches

## Setup

1. Run `sql/01_schema.sql` to create the database and tables.
2. Run `sql/02_triggers_procedures.sql` to add stock/alert automation.
3. Run `sql/03_views.sql` for reporting views.
4. Run `sql/04_sample_data.sql` to load demo data.
5. Try queries in `sql/05_queries.sql`.

Target RDBMS: MySQL 8+ (adjust syntax for PostgreSQL/Oracle if needed —
noted inline where syntax diverges).
<<<<<<< HEAD

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The current frontend runs with a schema-aligned demo dataset until the backend REST API
contract is finalized. See `frontend/README.md` for integration notes.
=======
>>>>>>> origin/main

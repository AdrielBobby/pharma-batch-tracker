# MedLedger — Pharmacy Batch & Expiry Management

MedLedger is a DBMS microproject for pharmacy inventory operations. It receives supplier stock batch-by-batch, records sales using FEFO (First Expired, First Out), blocks expired/insufficient stock, tracks expiry risk, and exposes normalized Oracle data through an Express API and React dashboard.

## Stack

- Oracle Database 23ai Free
- Node.js + Express
- React + TypeScript + Vite

## Database concepts demonstrated

- 10 normalized relational tables (up to 3NF)
- Primary, foreign, unique, not-null and check constraints
- 4 reporting views
- 4 integrity/stock triggers
- Stored procedure with cursor/loop/conditional logic
- Stored function with aggregate query
- JOIN, GROUP BY, HAVING, nested queries and aggregate functions
- Explicit transactions with COMMIT/ROLLBACK
- `SELECT ... FOR UPDATE` concurrency control during FEFO allocation
- Secondary indexes for common relationships/reports
- CRUD for medicine and supplier master data
- Immutable purchase/sale history through the normal UI, preserving auditability

## 1. Start Oracle on macOS with Docker

From the project root:

```bash
docker compose up -d
docker compose ps
```

Wait until Oracle reports healthy. Open SQL*Plus:

```bash
docker compose exec oracle sqlplus pharma/pharma_pwd@//localhost:1521/FREEPDB1
```

Install/reset the entire database with one command:

```sql
@/opt/pharma/database/run_all.sql
```

`run_all.sql` stops on SQL errors and executes the schema in the correct dependency order, so there is no manual script-order risk.

For optional verification after installation:

```bash
docker compose exec oracle sqlplus pharma/pharma_pwd@//localhost:1521/FREEPDB1
```

```sql
@/opt/pharma/database/07_validation.sql
EXIT;
```

## 2. Start the API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5001/api`

Health check:

```bash
curl http://localhost:5001/api/health
```

Expected:

```json
{"ok":true}
```

## 3. Start the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

Before submission/demo, verify a clean production build:

```bash
npm run build
```

## Main workflows

- Add, edit and safely delete unused medicines.
- Add, edit and safely delete unused suppliers.
- Receive stock against a supplier invoice and new/existing batch.
- Record a sale using earliest-expiring eligible stock across one or multiple batches.
- Identify repeat customers by unique phone/email when provided; anonymous walk-ins reuse the walk-in record.
- Review inventory, purchases, sales and exact sale batch allocations.
- Generate, review and resolve expiry alerts.
- Review low-stock, expired and near-expiry reports.

## Integrity rules

- Purchase-line INSERT/UPDATE/DELETE keeps batch stock synchronized.
- Sale-line INSERT/UPDATE/DELETE keeps batch stock synchronized.
- Expired stock cannot be sold.
- Stock cannot become negative.
- A purchase receipt cannot be reduced/deleted if doing so would invalidate stock already consumed.
- Line subtotal must equal `quantity × unit_price`.
- Purchase and sale header totals are maintained automatically by database triggers.
- Duplicate batch lines in the same purchase or sale are rejected.
- Master records referenced by transaction history cannot be deleted because foreign keys protect them.
- Purchase and sale transactions are intentionally not editable from the dashboard; transaction history is treated as an audit ledger.

## FEFO implementation

The backend opens an Oracle transaction and locks eligible batch rows with `SELECT ... FOR UPDATE`, ordered by expiry date. The FEFO planner allocates the requested quantity from the earliest-expiring valid batch first and continues across later batches only when necessary. Sale-item triggers perform a second database-level expiry/stock check and deduct inventory. Any failure rolls back the complete sale.

## Project documentation

- `docs/er-diagram.md` — relationships/schema
- `docs/normalization.md` — normalization explanation
- `docs/test-cases.md` — functional/integrity tests
- `docs/viva-guide.md` — DBMS viva preparation
- `docs/demo-flow.md` — recommended demonstration sequence
- `PROJECT_CHECKLIST.md` — final submission checklist

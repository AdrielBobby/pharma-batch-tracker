# 5-Minute Examiner Demo

1. **Overview** — state the problem in one sentence.
2. **Medicines vs Batches** — show why expiry/quantity belong to `MEDICINE_BATCH`.
3. **Purchase** — record a new batch/stock receipt; explain DML (`INSERT`/`UPDATE`).
4. **Sale** — create a sale for a medicine; explain how FEFO can allocate across multiple batches in expiry order.
5. **Trigger proof** — refresh Batches and show quantity reduced automatically; explain that UPDATE/DELETE reconciliation is also enforced in Oracle.
6. **Expiry** — click Generate alerts; explain procedure, cursor, loop and IF/ELSIF.
7. **Reports** — show the four views and low-stock `GROUP BY/HAVING` idea.
8. **CRUD + normalization** — edit a medicine/supplier, show protected deletion for historical records, then show ER/3NF notes.

## What NOT to discuss unless asked
Authentication, payment gateway, AI, microservices or advanced ORM patterns. They are intentionally outside this DBMS microproject. Multi-batch FEFO allocation is part of the core database workflow and is worth demonstrating.

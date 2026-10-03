# Viva Guide — Pharmacy Batch & Expiry Management

## 12 questions every member must know

### 1. What does the project do?
It tracks pharmacy medicines batch-wise, including expiry and quantity. It records purchases/sales and gives expiry and low-stock reports.

### 2. Why separate MEDICINE and MEDICINE_BATCH?
One medicine can be restocked in many batches, and every batch can have a different expiry date and stock quantity.

### 3. Primary key vs foreign key?
A primary key uniquely identifies a row. A foreign key references a primary/unique key in another table and maintains referential integrity.

### 4. What is normalization?
Organizing data into related tables to reduce redundancy and avoid insertion, update and deletion anomalies.

### 5. Why 3NF?
Non-key attributes depend on the key, the whole key and not another non-key attribute. Example: category details stay in CATEGORY, not MEDICINE.

### 6. Functional dependency?
X -> Y means one value of X determines exactly one value of Y. Example: `medicine_id -> medicine_name`.

### 7. What is a view?
A stored SQL query presented like a virtual table. Our views simplify inventory/expiry/low-stock reports.

### 8. What do the triggers do?
Four triggers protect the ledger. Purchase-line INSERT/UPDATE/DELETE keeps batch stock synchronized; sale-line INSERT/UPDATE/DELETE validates expiry/availability and reconciles stock; two total-maintenance triggers keep purchase and sale header totals synchronized with their detail lines.

### 9. What does the stored procedure do?
`GENERATE_EXPIRY_ALERTS` scans batches with a cursor, loops through them, uses IF/ELSIF to classify expired/near-expiry batches and inserts alert rows.

### 10. What does the function do?
`GET_TOTAL_STOCK(medicine_id)` returns SUM of available quantity across all batches for that medicine.

### 11. FEFO?
First Expired, First Out: sell the eligible batch with the earliest expiry first. If that batch is insufficient, continue with the next eligible batch.

### 12. WHERE vs HAVING?
`WHERE` filters rows before grouping. `HAVING` filters groups after `GROUP BY`/aggregation.

## Module 3 quick answers
- DDL: CREATE, ALTER, DROP.
- DML: INSERT, UPDATE, DELETE (SELECT is often discussed with DQL).
- DCL: GRANT, REVOKE. The Docker image provisions the PHARMA application user; GRANT/REVOKE are standard DCL concepts even though normal project operation does not require runtime DCL.
- Aggregate functions: SUM, COUNT, AVG, MIN, MAX.
- Nested query: a query inside another query; see `06_queries.sql`.
- PL/SQL variable: `v_stock` in the trigger.
- Conditional control: IF/ELSIF in procedure/trigger.
- Loop: cursor FOR loop in expiry procedure.
- Exception handling: `NO_DATA_FOUND` in the trigger plus `RAISE_APPLICATION_ERROR`.
- Cursor: pointer/result-set mechanism used to process query rows one by one.

## Module 4 quick answers
- Insertion anomaly: cannot insert one fact without another unrelated fact.
- Update anomaly: same fact repeated in many rows must be changed everywhere.
- Deletion anomaly: deleting one row accidentally removes another needed fact.
- 1NF: atomic values, no repeating groups.
- 2NF: 1NF + no partial dependency on part of a composite key.
- 3NF: 2NF + no transitive dependency of non-key attributes.
- BCNF: every determinant is a candidate key.
- Lossless join: decomposed tables can be joined back without losing/gaining invalid information.
- Dependency preserving: FDs can be enforced without joining decomposed relations.

## SQL worth memorizing
```sql
-- FEFO
SELECT * FROM medicine_batch
WHERE medicine_id = :id
  AND quantity_available > 0
  AND expiry_date >= TRUNC(SYSDATE)
ORDER BY expiry_date ASC, batch_id ASC
FOR UPDATE;
```

```sql
-- Aggregation
SELECT medicine_id, SUM(quantity_available)
FROM medicine_batch
GROUP BY medicine_id;
```

```sql
-- Low stock idea
HAVING SUM(quantity_available) < reorder_level
```

## Weakest-member safe explanation
> We mainly focused on the database. The frontend helps demonstrate it. Medicines and batches are separate because expiry belongs to a batch. Database triggers keep stock and transaction totals consistent even if detail rows are inserted, updated or deleted. Sales allocate stock in FEFO order, including across multiple batches when needed. A procedure creates expiry alerts, a function calculates total stock, and views provide operational reports. We normalized the schema to reduce duplication and anomalies.

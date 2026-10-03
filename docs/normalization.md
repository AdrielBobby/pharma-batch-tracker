# Normalization Notes (Viva Version)

## Why normalization is needed
Imagine one large table containing medicine, category, batch, supplier, purchase and customer details. Supplier and medicine data would repeat many times.

- **Insertion anomaly:** difficult to add a supplier before any purchase exists.
- **Update anomaly:** changing a supplier phone number may require changing many rows.
- **Deletion anomaly:** deleting the last purchase could accidentally remove the only supplier information.

## Functional dependencies used
- `category_id -> category_name, description`
- `medicine_id -> medicine_name, generic_name, dosage_form, strength, category_id, manufacturer, reorder_level`
- `supplier_id -> supplier_name, contact_person, phone, email, address`
- `batch_id -> medicine_id, batch_number, manufacture_date, expiry_date, selling_price, quantity_available`
- `purchase_id -> supplier_id, purchase_date, invoice_number, total_amount`
- `sale_id -> customer_id, sale_date, payment_method, total_amount`

## 1NF
Every column contains one atomic value. We do not store a list such as `batch1,batch2,batch3` in one cell.

## 2NF
Tables use a single-column primary key, so non-key attributes cannot depend on only part of a composite primary key. Junction/detail tables also store facts that belong to their row.

## 3NF
We remove transitive dependencies. Example: `category_name` is not repeated in `MEDICINE`; `MEDICINE.category_id` references `CATEGORY`.

## BCNF
For the core master tables, determinants such as IDs (and declared unique values such as category name/email where applicable) are candidate keys. For viva, explain BCNF as: **every determinant must be a candidate key**.

## Lossless join
The decomposition is lossless because child tables carry foreign keys referencing the parent primary keys. Joining `MEDICINE` to `CATEGORY` or `SALE_ITEM` to `SALE` and `MEDICINE_BATCH` reconstructs the related facts without inventing unrelated tuples.

## Dependency preservation
Important dependencies are enforced locally using primary keys, unique constraints, foreign keys and checks rather than requiring a join just to validate them.

## Attribute closure example
Given:
- `medicine_id -> category_id, medicine_name`
- `category_id -> category_name`

Then `medicine_id+` includes `medicine_id, medicine_name, category_id, category_name` by transitivity.

## Armstrong axioms
1. Reflexivity: if Y is a subset of X, then X -> Y.
2. Augmentation: if X -> Y, then XZ -> YZ.
3. Transitivity: if X -> Y and Y -> Z, then X -> Z.

## Indexing in this project
```sql
CREATE INDEX idx_batch_expiry ON medicine_batch(expiry_date);
CREATE INDEX idx_batch_medicine ON medicine_batch(medicine_id);
CREATE INDEX idx_purchase_supplier ON purchase(supplier_id);
CREATE INDEX idx_sale_customer ON sale(customer_id);
```
They speed up expiry, batch-by-medicine, supplier-purchase and customer-sale lookups. Trade-off: extra storage and some insert/update overhead.

### Theory quick distinction
- Dense index: index entry for every search-key value/record.
- Sparse index: entries only for some search-key values; data normally needs ordering.
- Primary index: built using the ordering primary key.
- Clustering index: ordering field is non-key and groups similar records.
- Secondary index: additional index on a non-ordering search field. Our explicit indexes are easiest to describe as secondary indexes.

## Derived transaction values
`PURCHASE_ITEM.subtotal` and `SALE_ITEM.subtotal` are stored transaction facts and are protected by CHECK constraints requiring `subtotal = quantity * unit_price`. Header `total_amount` values are maintained by triggers. This deliberately keeps invoice totals fast to retrieve while preventing update anomalies between header/detail totals.

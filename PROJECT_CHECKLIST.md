# Final DBMS Microproject Checklist

## Database
- [x] Normalized Oracle schema
- [x] Primary and foreign keys
- [x] Unique, NOT NULL and CHECK constraints
- [x] Indexed report/relationship columns
- [x] Purchase stock integrity on INSERT/UPDATE/DELETE
- [x] Sale stock integrity on INSERT/UPDATE/DELETE
- [x] Database-enforced line subtotals
- [x] Database-maintained purchase/sale totals
- [x] Views, trigger, procedure and function demonstrations
- [x] FEFO batch selection and concurrency locking
- [x] One-command `run_all.sql` setup
- [x] Reconciliation/validation SQL

## Backend
- [x] Oracle connectivity
- [x] Input validation
- [x] Medicine Create/Read/Update/Delete
- [x] Supplier Create/Read/Update/Delete
- [x] Transactional purchase workflow
- [x] Transactional FEFO sale workflow
- [x] Commit/rollback handling
- [x] Foreign-key/constraint error handling
- [x] Customer identity via unique email/phone when available
- [x] Alert generation and resolution
- [x] FEFO unit tests

## Frontend
- [x] Operational dashboard only; academic explanations kept in docs
- [x] Medicine add/edit/delete controls
- [x] Supplier add/edit/delete controls
- [x] Purchase workflow
- [x] Sale workflow
- [x] Customer contact fields for reliable customer matching
- [x] Inventory, expiry and report views
- [x] Search and responsive layout
- [ ] Run `npm install && npm run build` on the submission/demo machine

## Viva
- [x] ER diagram documentation
- [x] 1NF/2NF/3NF explanation
- [x] SQL query examples
- [x] Trigger/procedure/function explanation
- [x] FEFO explanation
- [x] ACID/transaction explanation
- [x] Concurrency/`FOR UPDATE` explanation
- [x] Test-case document
- [x] Demo flow

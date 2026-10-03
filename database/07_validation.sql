-- Manual integrity checks for viva/demo. Run after run_all.sql in a fresh SQL*Plus session.
SET SERVEROUTPUT ON

PROMPT === Object counts ===
SELECT COUNT(*) AS medicines FROM medicine;
SELECT COUNT(*) AS batches FROM medicine_batch;
SELECT COUNT(*) AS purchases FROM purchase;
SELECT COUNT(*) AS sales FROM sale;

PROMPT === Header totals reconcile with detail rows ===
SELECT p.purchase_id, p.total_amount header_total, SUM(pi.subtotal) detail_total
FROM purchase p JOIN purchase_item pi ON pi.purchase_id = p.purchase_id
GROUP BY p.purchase_id, p.total_amount
HAVING p.total_amount <> SUM(pi.subtotal);

SELECT s.sale_id, s.total_amount header_total, SUM(si.subtotal) detail_total
FROM sale s JOIN sale_item si ON si.sale_id = s.sale_id
GROUP BY s.sale_id, s.total_amount
HAVING s.total_amount <> SUM(si.subtotal);

PROMPT Both reconciliation queries above should return no rows.

PROMPT === Stock must never be negative ===
SELECT * FROM medicine_batch WHERE quantity_available < 0;

PROMPT === FEFO candidate order ===
SELECT m.medicine_name, b.batch_number, b.expiry_date, b.quantity_available
FROM medicine_batch b JOIN medicine m ON m.medicine_id=b.medicine_id
WHERE b.quantity_available > 0 AND b.expiry_date >= TRUNC(SYSDATE)
ORDER BY m.medicine_name, b.expiry_date, b.batch_id;

PROMPT === Function demonstration ===
SELECT m.medicine_name, get_total_stock(m.medicine_id) AS total_stock
FROM medicine m ORDER BY m.medicine_name;

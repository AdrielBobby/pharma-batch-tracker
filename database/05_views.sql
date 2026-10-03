CREATE OR REPLACE VIEW vw_current_inventory AS
SELECT m.medicine_id, m.medicine_name, m.manufacturer, m.reorder_level,
       b.batch_id, b.batch_number, b.expiry_date, b.selling_price, b.quantity_available
FROM medicine m
JOIN medicine_batch b ON b.medicine_id = m.medicine_id;

CREATE OR REPLACE VIEW vw_near_expiry_batches AS
SELECT b.batch_id, m.medicine_name, b.batch_number, b.expiry_date, b.quantity_available
FROM medicine_batch b
JOIN medicine m ON m.medicine_id = b.medicine_id
WHERE b.expiry_date BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + 30
  AND b.quantity_available > 0;

CREATE OR REPLACE VIEW vw_expired_batches AS
SELECT b.batch_id, m.medicine_name, b.batch_number, b.expiry_date, b.quantity_available
FROM medicine_batch b
JOIN medicine m ON m.medicine_id = b.medicine_id
WHERE b.expiry_date < TRUNC(SYSDATE)
  AND b.quantity_available > 0;

CREATE OR REPLACE VIEW vw_low_stock_medicines AS
SELECT m.medicine_id, m.medicine_name, m.reorder_level,
       NVL(SUM(b.quantity_available),0) AS total_stock
FROM medicine m
LEFT JOIN medicine_batch b ON b.medicine_id = m.medicine_id
GROUP BY m.medicine_id, m.medicine_name, m.reorder_level
HAVING NVL(SUM(b.quantity_available),0) < m.reorder_level;

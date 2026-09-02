-- Reporting views
USE pharma_batch_tracker;

-- Batches expiring within 30 days that still have stock
CREATE OR REPLACE VIEW vw_batches_expiring_soon AS
SELECT b.batch_id, m.name AS medicine_name, s.name AS supplier_name,
       b.batch_number, b.expiry_date, b.quantity_available,
       DATEDIFF(b.expiry_date, CURRENT_DATE) AS days_to_expiry
FROM batches b
JOIN medicines m ON m.medicine_id = b.medicine_id
JOIN suppliers s ON s.supplier_id = b.supplier_id
WHERE b.quantity_available > 0
  AND b.expiry_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY b.expiry_date;

-- Expired batches still holding stock (should be pulled/disposed)
CREATE OR REPLACE VIEW vw_expired_stock AS
SELECT b.batch_id, m.name AS medicine_name, s.name AS supplier_name,
       b.batch_number, b.expiry_date, b.quantity_available
FROM batches b
JOIN medicines m ON m.medicine_id = b.medicine_id
JOIN suppliers s ON s.supplier_id = b.supplier_id
WHERE b.quantity_available > 0
  AND b.expiry_date < CURRENT_DATE
ORDER BY b.expiry_date;

-- Current stock on hand per medicine (summed across all batches)
CREATE OR REPLACE VIEW vw_stock_by_medicine AS
SELECT m.medicine_id, m.name, SUM(b.quantity_available) AS total_available
FROM medicines m
JOIN batches b ON b.medicine_id = m.medicine_id
GROUP BY m.medicine_id, m.name;

-- Sales revenue by medicine
CREATE OR REPLACE VIEW vw_revenue_by_medicine AS
SELECT m.medicine_id, m.name, SUM(sa.total_amount) AS total_revenue,
       SUM(sa.quantity_sold) AS total_units_sold
FROM sales sa
JOIN batches b ON b.batch_id = sa.batch_id
JOIN medicines m ON m.medicine_id = b.medicine_id
GROUP BY m.medicine_id, m.name;

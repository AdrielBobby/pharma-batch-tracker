-- Example analytical / report queries
USE pharma_batch_tracker;

-- 1. Batches expiring in the next 30 days
SELECT * FROM vw_batches_expiring_soon;

-- 2. Expired stock still sitting in inventory
SELECT * FROM vw_expired_stock;

-- 3. Current total stock per medicine
SELECT * FROM vw_stock_by_medicine;

-- 4. Revenue per medicine
SELECT * FROM vw_revenue_by_medicine ORDER BY total_revenue DESC;

-- 5. Unresolved alerts, most recent first
SELECT ea.alert_id, m.name AS medicine_name, b.batch_number,
       ea.alert_type, ea.alert_date, ea.message
FROM expiry_alerts ea
JOIN batches b ON b.batch_id = ea.batch_id
JOIN medicines m ON m.medicine_id = b.medicine_id
WHERE ea.resolved = FALSE
ORDER BY ea.alert_date DESC;

-- 6. Which supplier's batches expire soonest, on average (supplier risk)
SELECT s.name AS supplier_name, AVG(DATEDIFF(b.expiry_date, CURRENT_DATE)) AS avg_days_to_expiry
FROM batches b
JOIN suppliers s ON s.supplier_id = b.supplier_id
WHERE b.quantity_available > 0
GROUP BY s.name
ORDER BY avg_days_to_expiry;

-- 7. FEFO pick order for a given medicine (first-expiry-first-out)
SELECT batch_id, batch_number, expiry_date, quantity_available
FROM batches
WHERE medicine_id = 1 AND quantity_available > 0
ORDER BY expiry_date ASC;

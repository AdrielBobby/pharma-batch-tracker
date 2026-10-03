-- Q1: Near-expiry batches (view)
SELECT * FROM vw_near_expiry_batches ORDER BY expiry_date;

-- Q2: Expired stock
SELECT * FROM vw_expired_batches ORDER BY expiry_date;

-- Q3: Current stock by medicine (aggregation + GROUP BY)
SELECT m.medicine_name, NVL(SUM(b.quantity_available),0) AS total_stock
FROM medicine m LEFT JOIN medicine_batch b ON b.medicine_id = m.medicine_id
GROUP BY m.medicine_name ORDER BY m.medicine_name;

-- Q4: Revenue by medicine (JOIN + aggregation)
SELECT m.medicine_name, SUM(si.subtotal) AS revenue
FROM sale_item si
JOIN medicine_batch b ON b.batch_id = si.batch_id
JOIN medicine m ON m.medicine_id = b.medicine_id
GROUP BY m.medicine_name ORDER BY revenue DESC;

-- Q5: Active alerts
SELECT a.alert_id, m.medicine_name, b.batch_number, a.alert_type, a.message
FROM alert a JOIN medicine_batch b ON b.batch_id=a.batch_id
JOIN medicine m ON m.medicine_id=b.medicine_id
WHERE a.status='ACTIVE';

-- Q6: Supplier-wise purchase summary
SELECT s.supplier_name, COUNT(DISTINCT p.purchase_id) purchases, SUM(pi.subtotal) amount
FROM supplier s JOIN purchase p ON p.supplier_id=s.supplier_id
JOIN purchase_item pi ON pi.purchase_id=p.purchase_id
GROUP BY s.supplier_name ORDER BY amount DESC;

-- Q7: FEFO pick order for medicine id 1
SELECT batch_id, batch_number, expiry_date, quantity_available
FROM medicine_batch
WHERE medicine_id=1 AND quantity_available>0 AND expiry_date>=TRUNC(SYSDATE)
ORDER BY expiry_date ASC;

-- Nested query example: medicines whose stock is below average medicine stock
SELECT medicine_name
FROM medicine
WHERE medicine_id IN (
  SELECT medicine_id FROM medicine_batch GROUP BY medicine_id
  HAVING SUM(quantity_available) < (
    SELECT AVG(total_stock) FROM (
      SELECT SUM(quantity_available) total_stock FROM medicine_batch GROUP BY medicine_id
    )
  )
);

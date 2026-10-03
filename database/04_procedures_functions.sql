-- Procedure demonstrates cursor, loop, IF/ELSIF and INSERT.
CREATE OR REPLACE PROCEDURE generate_expiry_alerts IS
  CURSOR c_batches IS
    SELECT batch_id, expiry_date
    FROM medicine_batch
    WHERE quantity_available > 0;
BEGIN
  -- Close alerts that are no longer applicable before creating current ones.
  UPDATE alert a
  SET status = 'RESOLVED'
  WHERE status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM medicine_batch b
      WHERE b.batch_id = a.batch_id
        AND b.quantity_available > 0
        AND ((a.alert_type = 'EXPIRED' AND b.expiry_date < TRUNC(SYSDATE))
          OR (a.alert_type = 'EXPIRING_SOON' AND b.expiry_date BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + 30))
    );

  FOR rec IN c_batches LOOP
    IF rec.expiry_date < TRUNC(SYSDATE) THEN
      INSERT INTO alert (batch_id, alert_type, message)
      SELECT rec.batch_id, 'EXPIRED', 'Batch has expired'
      FROM dual
      WHERE NOT EXISTS (
        SELECT 1 FROM alert
        WHERE batch_id = rec.batch_id AND alert_type = 'EXPIRED' AND status = 'ACTIVE'
      );
    ELSIF rec.expiry_date <= TRUNC(SYSDATE) + 30 THEN
      INSERT INTO alert (batch_id, alert_type, message)
      SELECT rec.batch_id, 'EXPIRING_SOON', 'Batch expires within 30 days'
      FROM dual
      WHERE NOT EXISTS (
        SELECT 1 FROM alert
        WHERE batch_id = rec.batch_id AND alert_type = 'EXPIRING_SOON' AND status = 'ACTIVE'
      );
    END IF;
  END LOOP;
END;
/

-- Function demonstrates parameter, aggregate query, variable and return value.
CREATE OR REPLACE FUNCTION get_total_stock(p_medicine_id NUMBER)
RETURN NUMBER
IS
  v_total NUMBER;
BEGIN
  SELECT NVL(SUM(quantity_available), 0)
  INTO v_total
  FROM medicine_batch
  WHERE medicine_id = p_medicine_id;
  RETURN v_total;
END;
/

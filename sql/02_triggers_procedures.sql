-- Triggers and stored procedures for stock updates and expiry alerts
USE pharma_batch_tracker;

DELIMITER $$

-- ---------------------------------------------------------------------
-- On sale, decrement batch stock and block overselling
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_sales_before_insert
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
    DECLARE available INT;

    SELECT quantity_available INTO available
    FROM batches
    WHERE batch_id = NEW.batch_id
    FOR UPDATE;

    IF available IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Batch does not exist';
    ELSEIF available < NEW.quantity_sold THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock in batch for this sale';
    END IF;
END$$

CREATE TRIGGER trg_sales_after_insert
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    UPDATE batches
    SET quantity_available = quantity_available - NEW.quantity_sold
    WHERE batch_id = NEW.batch_id;
END$$

-- ---------------------------------------------------------------------
-- Procedure: scan batches and (re)raise expiry alerts
-- Intended to be run on a schedule (see event below), or manually.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_raise_expiry_alerts(IN warning_window_days INT)
BEGIN
    -- Batches expiring within the warning window, not yet alerted today
    INSERT INTO expiry_alerts (batch_id, alert_type, message)
    SELECT b.batch_id,
           'EXPIRING_SOON',
           CONCAT('Batch ', b.batch_number, ' expires on ', b.expiry_date)
    FROM batches b
    WHERE b.quantity_available > 0
      AND b.expiry_date BETWEEN CURRENT_DATE
                             AND DATE_ADD(CURRENT_DATE, INTERVAL warning_window_days DAY)
      AND NOT EXISTS (
          SELECT 1 FROM expiry_alerts ea
          WHERE ea.batch_id = b.batch_id
            AND ea.alert_type = 'EXPIRING_SOON'
            AND ea.alert_date = CURRENT_DATE
      );

    -- Batches already expired with unsold stock, not yet alerted today
    INSERT INTO expiry_alerts (batch_id, alert_type, message)
    SELECT b.batch_id,
           'EXPIRED',
           CONCAT('Batch ', b.batch_number, ' expired on ', b.expiry_date, ' with stock remaining')
    FROM batches b
    WHERE b.quantity_available > 0
      AND b.expiry_date < CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM expiry_alerts ea
          WHERE ea.batch_id = b.batch_id
            AND ea.alert_type = 'EXPIRED'
            AND ea.alert_date = CURRENT_DATE
      );
END$$

DELIMITER ;

-- Example manual run: raise alerts for batches expiring within 30 days
-- CALL sp_raise_expiry_alerts(30);

-- Optional: automate the daily scan (requires event_scheduler = ON)
-- CREATE EVENT IF NOT EXISTS ev_daily_expiry_check
--     ON SCHEDULE EVERY 1 DAY
--     DO CALL sp_raise_expiry_alerts(30);

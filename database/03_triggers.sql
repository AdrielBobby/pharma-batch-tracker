-- Inventory and ledger-integrity triggers.

-- Keeps batch stock correct for INSERT, UPDATE and DELETE of purchase lines.
CREATE OR REPLACE TRIGGER trg_purchase_stock
AFTER INSERT OR UPDATE OR DELETE ON purchase_item
FOR EACH ROW
DECLARE
  v_stock medicine_batch.quantity_available%TYPE;
  v_new_stock NUMBER;
BEGIN
  IF INSERTING THEN
    UPDATE medicine_batch
    SET quantity_available = quantity_available + :NEW.quantity
    WHERE batch_id = :NEW.batch_id;
  ELSIF DELETING THEN
    SELECT quantity_available INTO v_stock FROM medicine_batch
    WHERE batch_id = :OLD.batch_id FOR UPDATE;
    IF v_stock < :OLD.quantity THEN
      RAISE_APPLICATION_ERROR(-20004, 'Purchase line cannot be deleted because some received stock has already been consumed');
    END IF;
    UPDATE medicine_batch SET quantity_available = quantity_available - :OLD.quantity
    WHERE batch_id = :OLD.batch_id;
  ELSE
    IF :OLD.batch_id = :NEW.batch_id THEN
      SELECT quantity_available INTO v_stock FROM medicine_batch
      WHERE batch_id = :NEW.batch_id FOR UPDATE;
      v_new_stock := v_stock + :NEW.quantity - :OLD.quantity;
      IF v_new_stock < 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Purchase quantity cannot be reduced below stock already consumed');
      END IF;
      UPDATE medicine_batch SET quantity_available = v_new_stock
      WHERE batch_id = :NEW.batch_id;
    ELSE
      SELECT quantity_available INTO v_stock FROM medicine_batch
      WHERE batch_id = :OLD.batch_id FOR UPDATE;
      IF v_stock < :OLD.quantity THEN
        RAISE_APPLICATION_ERROR(-20006, 'Purchase batch cannot be changed because some received stock has already been consumed');
      END IF;
      UPDATE medicine_batch SET quantity_available = quantity_available - :OLD.quantity
      WHERE batch_id = :OLD.batch_id;
      UPDATE medicine_batch SET quantity_available = quantity_available + :NEW.quantity
      WHERE batch_id = :NEW.batch_id;
    END IF;
  END IF;
END;
/

-- Keeps purchase header total synchronized with its line items.
CREATE OR REPLACE TRIGGER trg_purchase_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_item
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    UPDATE purchase SET total_amount = total_amount + :NEW.subtotal WHERE purchase_id = :NEW.purchase_id;
  ELSIF DELETING THEN
    UPDATE purchase SET total_amount = total_amount - :OLD.subtotal WHERE purchase_id = :OLD.purchase_id;
  ELSIF :OLD.purchase_id = :NEW.purchase_id THEN
    UPDATE purchase SET total_amount = total_amount - :OLD.subtotal + :NEW.subtotal WHERE purchase_id = :NEW.purchase_id;
  ELSE
    UPDATE purchase SET total_amount = total_amount - :OLD.subtotal WHERE purchase_id = :OLD.purchase_id;
    UPDATE purchase SET total_amount = total_amount + :NEW.subtotal WHERE purchase_id = :NEW.purchase_id;
  END IF;
END;
/

-- Validates expiry/stock and keeps inventory correct for sale-line INSERT/UPDATE/DELETE.
CREATE OR REPLACE TRIGGER trg_sale_stock
BEFORE INSERT OR UPDATE OR DELETE ON sale_item
FOR EACH ROW
DECLARE
  v_stock medicine_batch.quantity_available%TYPE;
  v_expiry medicine_batch.expiry_date%TYPE;
  v_effective NUMBER;
BEGIN
  IF DELETING THEN
    UPDATE medicine_batch
    SET quantity_available = quantity_available + :OLD.quantity
    WHERE batch_id = :OLD.batch_id;
    RETURN;
  END IF;

  SELECT quantity_available, expiry_date
  INTO v_stock, v_expiry
  FROM medicine_batch
  WHERE batch_id = :NEW.batch_id
  FOR UPDATE;

  IF v_expiry < TRUNC(SYSDATE) THEN
    RAISE_APPLICATION_ERROR(-20001, 'Expired batch cannot be sold');
  END IF;

  IF UPDATING AND :OLD.batch_id = :NEW.batch_id THEN
    v_effective := v_stock + :OLD.quantity;
    IF v_effective < :NEW.quantity THEN
      RAISE_APPLICATION_ERROR(-20002, 'Insufficient stock');
    END IF;
    UPDATE medicine_batch
    SET quantity_available = v_effective - :NEW.quantity
    WHERE batch_id = :NEW.batch_id;
  ELSE
    IF v_stock < :NEW.quantity THEN
      RAISE_APPLICATION_ERROR(-20002, 'Insufficient stock');
    END IF;
    IF UPDATING THEN
      UPDATE medicine_batch
      SET quantity_available = quantity_available + :OLD.quantity
      WHERE batch_id = :OLD.batch_id;
    END IF;
    UPDATE medicine_batch
    SET quantity_available = quantity_available - :NEW.quantity
    WHERE batch_id = :NEW.batch_id;
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20003, 'Batch not found');
END;
/

-- Keeps sale header total synchronized with its line items.
CREATE OR REPLACE TRIGGER trg_sale_total
AFTER INSERT OR UPDATE OR DELETE ON sale_item
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    UPDATE sale SET total_amount = total_amount + :NEW.subtotal WHERE sale_id = :NEW.sale_id;
  ELSIF DELETING THEN
    UPDATE sale SET total_amount = total_amount - :OLD.subtotal WHERE sale_id = :OLD.sale_id;
  ELSIF :OLD.sale_id = :NEW.sale_id THEN
    UPDATE sale SET total_amount = total_amount - :OLD.subtotal + :NEW.subtotal WHERE sale_id = :NEW.sale_id;
  ELSE
    UPDATE sale SET total_amount = total_amount - :OLD.subtotal WHERE sale_id = :OLD.sale_id;
    UPDATE sale SET total_amount = total_amount + :NEW.subtotal WHERE sale_id = :NEW.sale_id;
  END IF;
END;
/

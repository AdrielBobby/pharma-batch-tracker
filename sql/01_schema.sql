-- Pharmacy Expiry and Batch Monitoring: schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS pharma_batch_tracker;
USE pharma_batch_tracker;

-- ---------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
    supplier_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    contact_person  VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    address         VARCHAR(255)
);

-- ---------------------------------------------------------------------
-- Medicines (catalog, not stock)
-- ---------------------------------------------------------------------
CREATE TABLE medicines (
    medicine_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(80),
    unit            VARCHAR(20) NOT NULL,       -- e.g. 'strip', 'bottle', 'box'
    manufacturer    VARCHAR(150),
    UNIQUE KEY uq_medicine_name_manufacturer (name, manufacturer)
);

-- ---------------------------------------------------------------------
-- Batches (a specific received lot of a medicine)
-- ---------------------------------------------------------------------
CREATE TABLE batches (
    batch_id            INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id         INT NOT NULL,
    supplier_id         INT NOT NULL,
    batch_number        VARCHAR(50) NOT NULL,
    manufacture_date    DATE NOT NULL,
    expiry_date         DATE NOT NULL,
    quantity_received   INT NOT NULL CHECK (quantity_received > 0),
    quantity_available  INT NOT NULL CHECK (quantity_available >= 0),
    purchase_price      DECIMAL(10, 2) NOT NULL CHECK (purchase_price >= 0),
    received_date       DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_batch_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines (medicine_id),
    CONSTRAINT fk_batch_supplier FOREIGN KEY (supplier_id)
        REFERENCES suppliers (supplier_id),
    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number),
    CONSTRAINT chk_expiry_after_manufacture CHECK (expiry_date > manufacture_date)
);

CREATE INDEX idx_batches_expiry ON batches (expiry_date);

-- ---------------------------------------------------------------------
-- Sales (units sold out of a specific batch)
-- ---------------------------------------------------------------------
CREATE TABLE sales (
    sale_id         INT AUTO_INCREMENT PRIMARY KEY,
    batch_id        INT NOT NULL,
    quantity_sold   INT NOT NULL CHECK (quantity_sold > 0),
    unit_price      DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount    DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_sold * unit_price) STORED,
    sale_date       DATE NOT NULL DEFAULT (CURRENT_DATE),
    customer_name   VARCHAR(150),
    CONSTRAINT fk_sale_batch FOREIGN KEY (batch_id)
        REFERENCES batches (batch_id)
);

-- ---------------------------------------------------------------------
-- Expiry alerts (populated by trigger/procedure, see 02_triggers_procedures.sql)
-- ---------------------------------------------------------------------
CREATE TABLE expiry_alerts (
    alert_id    INT AUTO_INCREMENT PRIMARY KEY,
    batch_id    INT NOT NULL,
    alert_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
    alert_type  ENUM('EXPIRING_SOON', 'EXPIRED') NOT NULL,
    message     VARCHAR(255) NOT NULL,
    resolved    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_alert_batch FOREIGN KEY (batch_id)
        REFERENCES batches (batch_id)
);

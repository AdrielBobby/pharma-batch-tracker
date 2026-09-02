-- Seed data for demoing the schema
USE pharma_batch_tracker;

INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
    ('MedLine Distributors', 'Anita Rao', '9876543210', 'anita@medline.example', 'Bengaluru, IN'),
    ('HealthCore Pharma', 'Vikram Shah', '9123456780', 'vikram@healthcore.example', 'Mumbai, IN'),
    ('Sunrise Wholesale', 'Priya Nair', '9988776655', 'priya@sunrise.example', 'Chennai, IN');

INSERT INTO medicines (name, category, unit, manufacturer) VALUES
    ('Paracetamol 500mg', 'Analgesic', 'strip', 'Cipla'),
    ('Amoxicillin 250mg', 'Antibiotic', 'strip', 'Sun Pharma'),
    ('Cetirizine 10mg', 'Antihistamine', 'strip', 'Dr. Reddy''s'),
    ('Insulin Glargine', 'Hormone', 'vial', 'Biocon');

-- Mix of batches: some far from expiry, some expiring soon, one already expired
INSERT INTO batches (medicine_id, supplier_id, batch_number, manufacture_date, expiry_date, quantity_received, quantity_available, purchase_price, received_date) VALUES
    (1, 1, 'PCM-2024-A1', '2024-01-10', DATE_ADD(CURRENT_DATE, INTERVAL 400 DAY), 500, 500, 1.20, '2024-01-15'),
    (1, 1, 'PCM-2024-A2', '2023-06-01', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 300, 120, 1.15, '2023-06-05'),
    (2, 2, 'AMX-2023-B1', '2023-03-01', DATE_ADD(CURRENT_DATE, INTERVAL -15 DAY), 200, 40, 2.50, '2023-03-05'),
    (3, 3, 'CTZ-2024-C1', '2024-02-01', DATE_ADD(CURRENT_DATE, INTERVAL 200 DAY), 250, 250, 1.80, '2024-02-05'),
    (4, 2, 'INS-2024-D1', '2024-05-01', DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 60, 60, 350.00, '2024-05-05');

INSERT INTO sales (batch_id, quantity_sold, unit_price, customer_name, sale_date) VALUES
    (1, 20, 2.00, 'Walk-in', CURRENT_DATE),
    (2, 30, 2.00, 'City Clinic', CURRENT_DATE),
    (4, 10, 3.00, 'Walk-in', CURRENT_DATE);

-- Populate today's alerts from current data
CALL sp_raise_expiry_alerts(30);

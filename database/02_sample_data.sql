-- Small deterministic dataset that demonstrates every viva feature.

INSERT INTO category (category_name, description) VALUES ('Analgesic','Pain and fever relief');
INSERT INTO category (category_name, description) VALUES ('Antibiotic','Bacterial infection treatment');
INSERT INTO category (category_name, description) VALUES ('Antihistamine','Allergy relief');
INSERT INTO category (category_name, description) VALUES ('Hormone','Hormonal medicines');
INSERT INTO category (category_name, description) VALUES ('Gastro','Digestive medicines');

INSERT INTO medicine (medicine_name,generic_name,dosage_form,strength,category_id,manufacturer,reorder_level)
SELECT 'Paracetamol 500mg','Paracetamol','Tablet','500mg',category_id,'Cipla',100 FROM category WHERE category_name='Analgesic';
INSERT INTO medicine (medicine_name,generic_name,dosage_form,strength,category_id,manufacturer,reorder_level)
SELECT 'Amoxicillin 250mg','Amoxicillin','Capsule','250mg',category_id,'Sun Pharma',60 FROM category WHERE category_name='Antibiotic';
INSERT INTO medicine (medicine_name,generic_name,dosage_form,strength,category_id,manufacturer,reorder_level)
SELECT 'Cetirizine 10mg','Cetirizine','Tablet','10mg',category_id,'Dr Reddy''s',80 FROM category WHERE category_name='Antihistamine';
INSERT INTO medicine (medicine_name,generic_name,dosage_form,strength,category_id,manufacturer,reorder_level)
SELECT 'Insulin Glargine','Insulin Glargine','Injection','100IU/ml',category_id,'Biocon',70 FROM category WHERE category_name='Hormone';
INSERT INTO medicine (medicine_name,generic_name,dosage_form,strength,category_id,manufacturer,reorder_level)
SELECT 'Pantoprazole 40mg','Pantoprazole','Tablet','40mg',category_id,'Cipla',50 FROM category WHERE category_name='Gastro';

INSERT INTO supplier (supplier_name,contact_person,phone,email) VALUES ('MedLine Distributors','Anita Rao','9876543210','anita@medline.example');
INSERT INTO supplier (supplier_name,contact_person,phone,email) VALUES ('HealthCore Pharma','Vikram Shah','9123456780','vikram@healthcore.example');
INSERT INTO supplier (supplier_name,contact_person,phone,email) VALUES ('Sunrise Wholesale','Priya Nair','9988776655','priya@sunrise.example');
INSERT INTO supplier (supplier_name,contact_person,phone,email) VALUES ('CarePlus Agencies','Arun Menon','9000011111','arun@careplus.example');
INSERT INTO supplier (supplier_name,contact_person,phone,email) VALUES ('Metro Medisales','Sara Joseph','9000022222','sara@metro.example');

-- Relative dates keep the expiry demo valid whenever the script is run.
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'PCM-A1',SYSDATE-300,SYSDATE+240,2.00,0 FROM medicine WHERE medicine_name='Paracetamol 500mg';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'PCM-A2',SYSDATE-250,SYSDATE+10,2.00,0 FROM medicine WHERE medicine_name='Paracetamol 500mg';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'AMX-B1',SYSDATE-400,SYSDATE-15,4.50,0 FROM medicine WHERE medicine_name='Amoxicillin 250mg';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'AMX-B2',SYSDATE-120,SYSDATE+120,4.75,0 FROM medicine WHERE medicine_name='Amoxicillin 250mg';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'CTZ-C1',SYSDATE-100,SYSDATE+200,3.00,0 FROM medicine WHERE medicine_name='Cetirizine 10mg';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'INS-D1',SYSDATE-90,SYSDATE+25,420.00,0 FROM medicine WHERE medicine_name='Insulin Glargine';
INSERT INTO medicine_batch (medicine_id,batch_number,manufacture_date,expiry_date,selling_price,quantity_available)
SELECT medicine_id,'PAN-E1',SYSDATE-200,SYSDATE+55,6.00,0 FROM medicine WHERE medicine_name='Pantoprazole 40mg';

INSERT INTO customer (customer_name,phone) VALUES ('Walk-in Customer','0000000000');
INSERT INTO customer (customer_name,phone) VALUES ('City Clinic','9876500001');
INSERT INTO customer (customer_name,phone) VALUES ('Anna Mathew','9876500002');
INSERT INTO customer (customer_name,phone) VALUES ('Rahul Nair','9876500003');
INSERT INTO customer (customer_name,phone) VALUES ('Meera Thomas','9876500004');

-- Purchases create the complete stock history. TRG_PURCHASE_STOCK adds each received quantity.
INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-25,'INV-1001',0 FROM supplier WHERE supplier_name='MedLine Distributors';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,500,1.20,600 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1001' AND b.batch_number='PCM-A1';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-18,'INV-1002',0 FROM supplier WHERE supplier_name='MedLine Distributors';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,300,1.15,345 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1002' AND b.batch_number='PCM-A2';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-16,'INV-1003',0 FROM supplier WHERE supplier_name='HealthCore Pharma';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,200,2.50,500 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1003' AND b.batch_number='AMX-B1';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-12,'INV-1004',0 FROM supplier WHERE supplier_name='HealthCore Pharma';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,60,350,21000 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1004' AND b.batch_number='INS-D1';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-8,'INV-1005',0 FROM supplier WHERE supplier_name='Sunrise Wholesale';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,250,1.80,450 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1005' AND b.batch_number='CTZ-C1';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-6,'INV-1006',0 FROM supplier WHERE supplier_name='CarePlus Agencies';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,120,3.20,384 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1006' AND b.batch_number='AMX-B2';

INSERT INTO purchase (supplier_id,purchase_date,invoice_number,total_amount)
SELECT supplier_id,SYSDATE-4,'INV-1007',0 FROM supplier WHERE supplier_name='Metro Medisales';
INSERT INTO purchase_item (purchase_id,batch_id,quantity,unit_price,subtotal)
SELECT p.purchase_id,b.batch_id,30,4.00,120 FROM purchase p CROSS JOIN medicine_batch b WHERE p.invoice_number='INV-1007' AND b.batch_number='PAN-E1';

COMMIT;

-- Demo sales. run_all.sql guarantees triggers exist before this seed file.
INSERT INTO sale (customer_id,sale_date,payment_method,total_amount)
SELECT customer_id,SYSDATE-2,'CASH',0 FROM customer WHERE customer_name='Walk-in Customer';
INSERT INTO sale_item (sale_id,batch_id,quantity,unit_price,subtotal)
SELECT s.sale_id,b.batch_id,20,2.00,40 FROM sale s CROSS JOIN medicine_batch b
WHERE s.payment_method='CASH' AND s.total_amount=0 AND b.batch_number='PCM-A2' AND ROWNUM=1;

INSERT INTO sale (customer_id,sale_date,payment_method,total_amount)
SELECT customer_id,SYSDATE-1,'UPI',0 FROM customer WHERE customer_name='City Clinic';
INSERT INTO sale_item (sale_id,batch_id,quantity,unit_price,subtotal)
SELECT s.sale_id,b.batch_id,10,3.00,30 FROM sale s CROSS JOIN medicine_batch b
WHERE s.payment_method='UPI' AND s.total_amount=0 AND b.batch_number='CTZ-C1' AND ROWNUM=1;

COMMIT;

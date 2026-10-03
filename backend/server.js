import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import oracledb from 'oracledb';
import { query, withTransaction } from './db.js';
import { planFefo } from './fefo.js';

const app = express();
const port = Number(process.env.PORT || 5001);
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const rows = result => result.rows || [];
class AppError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}
const requiredText = (value, field, max = 150) => {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) throw new AppError(`${field} is required`, 400);
  if (cleaned.length > max) throw new AppError(`${field} is too long`, 400);
  return cleaned;
};
const optionalText = (value, max = 150) => {
  const cleaned = String(value ?? '').trim();
  if (cleaned.length > max) throw new AppError('A value is too long', 400);
  return cleaned || null;
};
const optionalEmail = value => {
  const email = optionalText(value, 150);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Email must be valid', 400);
  return email;
};
const positiveNumber = (value, field, allowZero = false) => {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new AppError(`${field} must be ${allowZero ? 'zero or greater' : 'greater than zero'}`, 400);
  }
  return number;
};
const validDate = (value, field) => {
  const cleaned = requiredText(value, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned) || Number.isNaN(Date.parse(`${cleaned}T00:00:00Z`))) {
    throw new AppError(`${field} must be a valid date`, 400);
  }
  return cleaned;
};
const handleError = (res, error) => {
  console.error(error);
  if (error instanceof AppError) return res.status(error.status).json({ error: error.message });
  if (error?.errorNum === 1) return res.status(409).json({ error: 'A record with these details already exists' });
  if (error?.errorNum === 2291) return res.status(400).json({ error: 'A referenced record does not exist' });
  if (error?.errorNum === 2292) return res.status(409).json({ error: 'This record is already used by transaction history and cannot be deleted' });
  if (error?.errorNum === 2290 || (error?.errorNum >= 20000 && error?.errorNum <= 20999)) {
    return res.status(400).json({ error: String(error.message).replace(/^ORA-\d+:\s*/, '').split('\n')[0] });
  }
  return res.status(500).json({ error: 'The request could not be completed' });
};

app.get('/api/health', async (_req, res) => {
  try { await query('SELECT 1 AS ok FROM dual'); res.json({ ok: true }); }
  catch (error) { handleError(res, error); }
});

app.get('/api/categories', async (_req, res) => {
  try { res.json(rows(await query('SELECT category_id, category_name FROM category ORDER BY category_name'))); }
  catch (error) { handleError(res, error); }
});

app.get('/api/medicines', async (_req, res) => {
  try {
    res.json(rows(await query(`SELECT m.medicine_id, m.medicine_name, m.generic_name, m.category_id, c.category_name,
      m.manufacturer, m.dosage_form, m.strength, m.reorder_level,
      NVL(SUM(b.quantity_available), 0) total_stock
      FROM medicine m JOIN category c ON c.category_id = m.category_id
      LEFT JOIN medicine_batch b ON b.medicine_id = m.medicine_id
      GROUP BY m.medicine_id, m.medicine_name, m.generic_name, m.category_id, c.category_name,
        m.manufacturer, m.dosage_form, m.strength, m.reorder_level
      ORDER BY m.medicine_name`)));
  } catch (error) { handleError(res, error); }
});

app.post('/api/medicines', async (req, res) => {
  try {
    await query(`INSERT INTO medicine
      (medicine_name, generic_name, category_id, manufacturer, dosage_form, strength, reorder_level)
      VALUES (:medicineName, :genericName, :categoryId, :manufacturer, :dosageForm, :strength, :reorderLevel)`, {
      medicineName: requiredText(req.body.medicine_name, 'Medicine name'),
      genericName: optionalText(req.body.generic_name),
      categoryId: positiveNumber(req.body.category_id, 'Category'),
      manufacturer: optionalText(req.body.manufacturer),
      dosageForm: optionalText(req.body.dosage_form, 50),
      strength: optionalText(req.body.strength, 50),
      reorderLevel: positiveNumber(req.body.reorder_level ?? 10, 'Reorder level', true)
    }, { autoCommit: true });
    res.status(201).json({ message: 'Medicine added' });
  } catch (error) { handleError(res, error); }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const id = positiveNumber(req.params.id, 'Medicine');
    const result = await query(`UPDATE medicine SET medicine_name=:medicineName, generic_name=:genericName,
      category_id=:categoryId, manufacturer=:manufacturer, dosage_form=:dosageForm,
      strength=:strength, reorder_level=:reorderLevel WHERE medicine_id=:id`, {
      id,
      medicineName: requiredText(req.body.medicine_name, 'Medicine name'),
      genericName: optionalText(req.body.generic_name),
      categoryId: positiveNumber(req.body.category_id, 'Category'),
      manufacturer: optionalText(req.body.manufacturer),
      dosageForm: optionalText(req.body.dosage_form, 50),
      strength: optionalText(req.body.strength, 50),
      reorderLevel: positiveNumber(req.body.reorder_level ?? 10, 'Reorder level', true)
    }, { autoCommit: true });
    if (!result.rowsAffected) throw new AppError('Medicine not found', 404);
    res.json({ message: 'Medicine updated' });
  } catch (error) { handleError(res, error); }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    const id = positiveNumber(req.params.id, 'Medicine');
    const result = await query('DELETE FROM medicine WHERE medicine_id=:id', { id }, { autoCommit: true });
    if (!result.rowsAffected) throw new AppError('Medicine not found', 404);
    res.json({ message: 'Medicine deleted' });
  } catch (error) { handleError(res, error); }
});

app.get('/api/suppliers', async (_req, res) => {
  try { res.json(rows(await query('SELECT supplier_id, supplier_name, contact_person, phone, email FROM supplier ORDER BY supplier_name'))); }
  catch (error) { handleError(res, error); }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    await query(`INSERT INTO supplier (supplier_name, contact_person, phone, email)
      VALUES (:supplierName, :contactPerson, :phone, :email)`, {
      supplierName: requiredText(req.body.supplier_name, 'Supplier name'),
      contactPerson: optionalText(req.body.contact_person, 100),
      phone: optionalText(req.body.phone, 20),
      email: optionalEmail(req.body.email)
    }, { autoCommit: true });
    res.status(201).json({ message: 'Supplier added' });
  } catch (error) { handleError(res, error); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const id = positiveNumber(req.params.id, 'Supplier');
    const result = await query(`UPDATE supplier SET supplier_name=:supplierName, contact_person=:contactPerson,
      phone=:phone, email=:email WHERE supplier_id=:id`, {
      id,
      supplierName: requiredText(req.body.supplier_name, 'Supplier name'),
      contactPerson: optionalText(req.body.contact_person, 100),
      phone: optionalText(req.body.phone, 20),
      email: optionalEmail(req.body.email)
    }, { autoCommit: true });
    if (!result.rowsAffected) throw new AppError('Supplier not found', 404);
    res.json({ message: 'Supplier updated' });
  } catch (error) { handleError(res, error); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const id = positiveNumber(req.params.id, 'Supplier');
    const result = await query('DELETE FROM supplier WHERE supplier_id=:id', { id }, { autoCommit: true });
    if (!result.rowsAffected) throw new AppError('Supplier not found', 404);
    res.json({ message: 'Supplier deleted' });
  } catch (error) { handleError(res, error); }
});

app.get('/api/batches', async (_req, res) => {
  try {
    res.json(rows(await query(`SELECT b.batch_id, b.batch_number, b.manufacture_date, b.expiry_date,
      b.selling_price, b.quantity_available, m.medicine_id, m.medicine_name,
      (SELECT MAX(s.supplier_name) KEEP (DENSE_RANK LAST ORDER BY p.purchase_date)
       FROM purchase_item pi JOIN purchase p ON p.purchase_id = pi.purchase_id
       JOIN supplier s ON s.supplier_id = p.supplier_id WHERE pi.batch_id = b.batch_id) supplier_name
      FROM medicine_batch b JOIN medicine m ON m.medicine_id = b.medicine_id
      ORDER BY b.expiry_date, m.medicine_name`)));
  } catch (error) { handleError(res, error); }
});

app.get('/api/purchases', async (_req, res) => {
  try {
    res.json(rows(await query(`SELECT p.purchase_id, p.invoice_number, p.purchase_date, s.supplier_name,
      SUM(pi.quantity) quantity, SUM(pi.subtotal) total_amount
      FROM purchase p JOIN supplier s ON s.supplier_id = p.supplier_id
      JOIN purchase_item pi ON pi.purchase_id = p.purchase_id
      GROUP BY p.purchase_id, p.invoice_number, p.purchase_date, s.supplier_name
      ORDER BY p.purchase_date DESC, p.purchase_id DESC`)));
  } catch (error) { handleError(res, error); }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const supplierId = positiveNumber(req.body.supplier_id, 'Supplier');
    const medicineId = positiveNumber(req.body.medicine_id, 'Medicine');
    const invoiceNumber = requiredText(req.body.invoice_number, 'Invoice number', 50);
    const batchNumber = requiredText(req.body.batch_number, 'Batch number', 50);
    const manufactureDate = validDate(req.body.manufacture_date, 'Manufacture date');
    const expiryDate = validDate(req.body.expiry_date, 'Expiry date');
    if (expiryDate <= manufactureDate) throw new AppError('Expiry date must be after manufacture date', 400);
    const quantity = positiveNumber(req.body.quantity, 'Quantity');
    const unitPrice = positiveNumber(req.body.unit_price, 'Purchase price', true);
    const sellingPrice = positiveNumber(req.body.selling_price, 'Selling price', true);
    const total = quantity * unitPrice;

    await withTransaction(async connection => {
      const purchase = await connection.execute(
        `INSERT INTO purchase (supplier_id, invoice_number, total_amount)
         VALUES (:supplierId, :invoiceNumber, 0) RETURNING purchase_id INTO :id`,
        { supplierId, invoiceNumber, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
      const purchaseId = purchase.outBinds.id[0];
      const found = await connection.execute(
        `SELECT batch_id, TO_CHAR(manufacture_date, 'YYYY-MM-DD') manufacture_date,
          TO_CHAR(expiry_date, 'YYYY-MM-DD') expiry_date
         FROM medicine_batch WHERE medicine_id = :medicineId AND batch_number = :batchNumber FOR UPDATE`,
        { medicineId, batchNumber });
      let batchId;
      if (found.rows.length) {
        const existing = found.rows[0];
        if (existing.EXPIRY_DATE !== expiryDate || existing.MANUFACTURE_DATE !== manufactureDate) {
          throw new AppError('Existing batch dates do not match this receipt', 409);
        }
        batchId = existing.BATCH_ID;
        await connection.execute(`UPDATE medicine_batch SET selling_price = :sellingPrice
          WHERE batch_id = :batchId`, { sellingPrice, batchId });
      } else {
        const created = await connection.execute(
          `INSERT INTO medicine_batch
           (medicine_id, batch_number, manufacture_date, expiry_date, selling_price, quantity_available)
           VALUES (:medicineId, :batchNumber, TO_DATE(:manufactureDate, 'YYYY-MM-DD'),
             TO_DATE(:expiryDate, 'YYYY-MM-DD'), :sellingPrice, 0)
           RETURNING batch_id INTO :id`,
          { medicineId, batchNumber, manufactureDate, expiryDate, sellingPrice,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
        batchId = created.outBinds.id[0];
      }
      await connection.execute(`INSERT INTO purchase_item
        (purchase_id, batch_id, quantity, unit_price, subtotal)
        VALUES (:purchaseId, :batchId, :quantity, :unitPrice, :total)`,
      { purchaseId, batchId, quantity, unitPrice, total });
    });
    res.status(201).json({ message: 'Stock receipt recorded' });
  } catch (error) { handleError(res, error); }
});

app.get('/api/sales', async (_req, res) => {
  try {
    res.json(rows(await query(`SELECT s.sale_id, s.sale_date,
      NVL(c.customer_name, 'Walk-in Customer') customer_name, s.payment_method,
      m.medicine_name, b.batch_number, si.quantity, si.unit_price, si.subtotal, s.total_amount sale_total
      FROM sale s LEFT JOIN customer c ON c.customer_id = s.customer_id
      JOIN sale_item si ON si.sale_id = s.sale_id JOIN medicine_batch b ON b.batch_id = si.batch_id
      JOIN medicine m ON m.medicine_id = b.medicine_id
      ORDER BY s.sale_date DESC, s.sale_id DESC, b.expiry_date`)));
  } catch (error) { handleError(res, error); }
});

app.post('/api/sales', async (req, res) => {
  try {
    const medicineId = positiveNumber(req.body.medicine_id, 'Medicine');
    const requestedQuantity = positiveNumber(req.body.quantity, 'Quantity');
    const customerName = optionalText(req.body.customer_name) || 'Walk-in Customer';
    const customerPhone = optionalText(req.body.customer_phone, 20);
    const customerEmail = optionalEmail(req.body.customer_email);
    const paymentMethod = String(req.body.payment_method || 'CASH').toUpperCase();
    if (!['CASH', 'CARD', 'UPI', 'OTHER'].includes(paymentMethod)) throw new AppError('Invalid payment method', 400);

    const allocation = await withTransaction(async connection => {
      const batchResult = await connection.execute(`SELECT batch_id, batch_number, selling_price, quantity_available
        FROM medicine_batch WHERE medicine_id = :medicineId AND quantity_available > 0
          AND expiry_date >= TRUNC(SYSDATE)
        ORDER BY expiry_date ASC, batch_id ASC FOR UPDATE`, { medicineId });
      const plan = planFefo(batchResult.rows, requestedQuantity);
      if (!plan.fulfilled) throw new AppError(`Only ${plan.available} eligible unit(s) are available`, 409);

      let customerResult;
      if (customerEmail) {
        customerResult = await connection.execute('SELECT customer_id FROM customer WHERE LOWER(email)=LOWER(:email)', { email: customerEmail });
      } else if (customerPhone) {
        customerResult = await connection.execute('SELECT customer_id FROM customer WHERE phone=:phone', { phone: customerPhone });
      } else if (customerName === 'Walk-in Customer') {
        customerResult = await connection.execute("SELECT customer_id FROM customer WHERE customer_name='Walk-in Customer' FETCH FIRST 1 ROW ONLY");
      } else {
        customerResult = { rows: [] };
      }
      let customerId;
      if (customerResult.rows.length) customerId = customerResult.rows[0].CUSTOMER_ID;
      else {
        const created = await connection.execute(
          `INSERT INTO customer (customer_name, phone, email)
           VALUES (:customerName, :customerPhone, :customerEmail) RETURNING customer_id INTO :id`,
          { customerName, customerPhone, customerEmail, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
        customerId = created.outBinds.id[0];
      }

      const sale = await connection.execute(
        `INSERT INTO sale (customer_id, payment_method, total_amount)
         VALUES (:customerId, :paymentMethod, 0) RETURNING sale_id INTO :id`,
        { customerId, paymentMethod, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } });
      const saleId = sale.outBinds.id[0];
      let total = 0;
      const usedBatches = [];

      for (const item of plan.allocations) {
        const batch = item.batch;
        const allocated = item.quantity;
        const subtotal = allocated * Number(batch.SELLING_PRICE);
        await connection.execute(`INSERT INTO sale_item
          (sale_id, batch_id, quantity, unit_price, subtotal)
          VALUES (:saleId, :batchId, :quantity, :price, :subtotal)`,
        { saleId, batchId: batch.BATCH_ID, quantity: allocated, price: batch.SELLING_PRICE, subtotal });
        total += subtotal;
        usedBatches.push({ batch: batch.BATCH_NUMBER, quantity: allocated });
      }
      return { saleId, total, batches: usedBatches };
    });
    res.status(201).json({ message: 'Sale recorded using earliest-expiry stock', ...allocation });
  } catch (error) { handleError(res, error); }
});

const reportViews = {
  inventory: 'vw_current_inventory',
  'near-expiry': 'vw_near_expiry_batches',
  expired: 'vw_expired_batches',
  'low-stock': 'vw_low_stock_medicines'
};
for (const [name, view] of Object.entries(reportViews)) {
  app.get(`/api/reports/${name}`, async (_req, res) => {
    try { res.json(rows(await query(`SELECT * FROM ${view}`))); }
    catch (error) { handleError(res, error); }
  });
}

app.get('/api/alerts', async (_req, res) => {
  try {
    res.json(rows(await query(`SELECT a.alert_id, a.alert_type, a.alert_date, a.message, a.status,
      m.medicine_name, b.batch_number, b.expiry_date, b.quantity_available
      FROM alert a JOIN medicine_batch b ON b.batch_id = a.batch_id
      JOIN medicine m ON m.medicine_id = b.medicine_id
      ORDER BY CASE a.status WHEN 'ACTIVE' THEN 0 ELSE 1 END, a.alert_date DESC`)));
  } catch (error) { handleError(res, error); }
});

app.post('/api/alerts/generate', async (_req, res) => {
  try { await query('BEGIN generate_expiry_alerts; END;', {}, { autoCommit: true }); res.json({ message: 'Expiry alerts refreshed' }); }
  catch (error) { handleError(res, error); }
});

app.patch('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const id = positiveNumber(req.params.id, 'Alert');
    const result = await query(`UPDATE alert SET status = 'RESOLVED'
      WHERE alert_id = :id AND status = 'ACTIVE'`, { id }, { autoCommit: true });
    if (!result.rowsAffected) throw new AppError('Active alert not found', 404);
    res.json({ message: 'Alert resolved' });
  } catch (error) { handleError(res, error); }
});

app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
app.listen(port, () => console.log(`Pharma API running at http://localhost:${port}`));

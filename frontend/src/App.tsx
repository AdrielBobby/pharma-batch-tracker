import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, Boxes, Check, ChevronRight, ClipboardList, Clock3,
  FileBarChart, LayoutDashboard, Menu, PackagePlus, Pencil, Pill, Plus, RefreshCw,
  Search, ShoppingBag, Store, Trash2, Truck, X
} from 'lucide-react';
import { api, daysLeft } from './data';

type Page = 'Overview' | 'Inventory' | 'Medicines' | 'Suppliers' | 'Purchases' | 'Sales' | 'Expiry' | 'Reports';
type Row = Record<string, unknown>;
type Toast = { message: string; kind: 'success' | 'error' } | null;
type FormMode = 'sale' | 'purchase' | 'medicine' | 'supplier';
type Dataset = {
  medicines: Row[]; categories: Row[]; batches: Row[]; suppliers: Row[];
  purchases: Row[]; sales: Row[]; alerts: Row[]; inventory: Row[];
  nearExpiry: Row[]; expired: Row[]; lowStock: Row[];
};

const emptyData: Dataset = {
  medicines: [], categories: [], batches: [], suppliers: [], purchases: [], sales: [],
  alerts: [], inventory: [], nearExpiry: [], expired: [], lowStock: []
};
const value = (row: Row, key: string) => row[key];
const stringValue = (row: Row, key: string) => String(value(row, key) ?? '');
const numberValue = (row: Row, key: string) => Number(value(row, key) ?? 0);
const formatDate = (date: unknown) => date
  ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(String(date)))
  : '—';
const money = (amount: unknown) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const navigation: { page: Page; icon: typeof Pill }[] = [
  { page: 'Overview', icon: LayoutDashboard }, { page: 'Inventory', icon: Boxes },
  { page: 'Medicines', icon: Pill }, { page: 'Suppliers', icon: Truck },
  { page: 'Purchases', icon: PackagePlus }, { page: 'Sales', icon: ShoppingBag },
  { page: 'Expiry', icon: Clock3 }, { page: 'Reports', icon: FileBarChart }
];

function StockState({ expiry, quantity }: { expiry: unknown; quantity?: unknown }) {
  const days = daysLeft(String(expiry));
  const empty = Number(quantity ?? 1) === 0;
  const label = empty ? 'Depleted' : days < 0 ? 'Expired' : days <= 30 ? `${days}d left` : 'Healthy';
  const state = empty ? 'neutral' : days < 0 ? 'danger' : days <= 30 ? 'warning' : 'success';
  return <span className={`status-pill ${state}`}><i />{label}</span>;
}

function Modal({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return <div className="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className="action-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog-head"><div><span>{eyebrow}</span><h2>{title}</h2></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
      </div>{children}
    </div>
  </div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<FormMode | ''>('');
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<Toast>(null);
  const [data, setData] = useState<Dataset>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const notify = (message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3200);
  };
  async function load() {
    try {
      setLoading(true); setError('');
      const [medicines, categories, batches, suppliers, purchases, sales, alerts, inventory, nearExpiry, expired, lowStock] = await Promise.all([
        api<Row[]>('/medicines'), api<Row[]>('/categories'), api<Row[]>('/batches'), api<Row[]>('/suppliers'),
        api<Row[]>('/purchases'), api<Row[]>('/sales'), api<Row[]>('/alerts'), api<Row[]>('/reports/inventory'),
        api<Row[]>('/reports/near-expiry'), api<Row[]>('/reports/expired'), api<Row[]>('/reports/low-stock')
      ]);
      setData({ medicines, categories, batches, suppliers, purchases, sales, alerts, inventory, nearExpiry, expired, lowStock });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to connect');
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const totalUnits = useMemo(() => data.batches.reduce((sum, batch) => sum + numberValue(batch, 'QUANTITY_AVAILABLE'), 0), [data.batches]);
  const retailValue = useMemo(() => data.batches.reduce((sum, batch) => sum + numberValue(batch, 'QUANTITY_AVAILABLE') * numberValue(batch, 'SELLING_PRICE'), 0), [data.batches]);
  const activeAlerts = data.alerts.filter(alert => stringValue(alert, 'STATUS') === 'ACTIVE');
  const urgentCount = data.nearExpiry.length + data.expired.length;

  const changePage = (next: Page) => { setPage(next); setSearch(''); setMenuOpen(false); };
  async function refreshAlerts() {
    try { await api('/alerts/generate', { method: 'POST' }); await load(); notify('Expiry alerts refreshed'); }
    catch (caught) { notify(caught instanceof Error ? caught.message : 'Unable to refresh alerts', 'error'); }
  }
  async function resolveAlert(id: unknown) {
    try { await api(`/alerts/${Number(id)}/resolve`, { method: 'PATCH' }); await load(); notify('Alert resolved'); }
    catch (caught) { notify(caught instanceof Error ? caught.message : 'Unable to resolve alert', 'error'); }
  }

  async function deleteMaster(kind: 'medicine' | 'supplier', row: Row) {
    const idKey = kind === 'medicine' ? 'MEDICINE_ID' : 'SUPPLIER_ID';
    const labelKey = kind === 'medicine' ? 'MEDICINE_NAME' : 'SUPPLIER_NAME';
    const id = Number(value(row, idKey));
    const label = stringValue(row, labelKey);
    if (!window.confirm(`Delete ${label}? Records already used by transaction history are protected.`)) return;
    try {
      const result = await api<{ message: string }>(`/${kind}s/${id}`, { method: 'DELETE' });
      await load(); notify(result.message);
    } catch (caught) { notify(caught instanceof Error ? caught.message : 'Unable to delete record', 'error'); }
  }
  function editMaster(kind: 'medicine' | 'supplier', row: Row) {
    setEditRow(row); setForm(kind);
  }

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><Pill size={22} /></span><div><strong>MedLedger</strong><small>Pharmacy operations</small></div></div>
      <nav aria-label="Main navigation">
        <span className="nav-label">Workspace</span>
        {navigation.map(({ page: item, icon: Icon }) => <button key={item} className={page === item ? 'active' : ''} onClick={() => changePage(item)}>
          <Icon size={18} /><span>{item}</span>{item === 'Expiry' && urgentCount > 0 && <em>{urgentCount}</em>}
        </button>)}
      </nav>
      <div className="sidebar-foot"><span className={error ? 'connection-dot offline' : 'connection-dot'} /><div><strong>{error ? 'Connection unavailable' : 'Systems online'}</strong><small>{error ? 'Check API and Oracle' : 'Inventory is live'}</small></div></div>
    </aside>
    {menuOpen && <button className="menu-shade" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

    <div className="main-shell">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
        <div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${page.toLowerCase()}`} aria-label={`Search ${page}`} /></div>
        <button className="icon-button refresh" onClick={() => void load()} aria-label="Refresh data"><RefreshCw size={18} /></button>
        <button className="primary-button" onClick={() => setForm('sale')}><Plus size={17} />New sale</button>
      </header>

      <main>
        {loading ? <LoadingState /> : error ? <ConnectionState message={error} retry={() => void load()} /> : page === 'Overview' ?
          <Overview data={data} totalUnits={totalUnits} retailValue={retailValue} activeAlerts={activeAlerts.length} openForm={setForm} go={changePage} /> :
          <DataPage page={page} data={data} search={search} openForm={mode => { setEditRow(null); setForm(mode); }} refreshAlerts={() => void refreshAlerts()} resolveAlert={resolveAlert} editMaster={editMaster} deleteMaster={deleteMaster} />}
      </main>
    </div>

    {form && <ActionForm mode={form} data={data} editRow={editRow} onClose={() => { setForm(''); setEditRow(null); }} onSuccess={async message => {
      setForm(''); setEditRow(null); await load(); notify(message);
    }} />}
    {toast && <div className={`toast ${toast.kind}`} role="status">{toast.kind === 'success' ? <Check size={17} /> : <AlertTriangle size={17} />}{toast.message}</div>}
  </div>;
}

function LoadingState() {
  return <div className="state-card"><span className="loader" /><h2>Loading inventory</h2><p>Retrieving the latest pharmacy records.</p></div>;
}

function ConnectionState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="state-card error-state"><AlertTriangle size={28} /><h2>Unable to load the workspace</h2><p>{message}</p><button className="primary-button" onClick={retry}><RefreshCw size={16} />Try again</button></div>;
}

function Overview({ data, totalUnits, retailValue, activeAlerts, openForm, go }: {
  data: Dataset; totalUnits: number; retailValue: number; activeAlerts: number;
  openForm: (mode: FormMode) => void; go: (page: Page) => void;
}) {
  const recentSales = data.sales.slice(0, 5);
  const expiryWatch = [...data.expired, ...data.nearExpiry].slice(0, 5);
  return <>
    <section className="page-heading overview-heading"><div><span className="eyebrow">Inventory overview</span><h1>Good stock starts with clear visibility.</h1><p>Monitor quantities, expiry exposure and the movement of every batch from one workspace.</p></div>
      <button className="secondary-button" onClick={() => openForm('purchase')}><PackagePlus size={17} />Receive stock</button>
    </section>

    <section className="metrics-grid">
      <Metric label="Units on hand" value={totalUnits.toLocaleString('en-IN')} detail={`${data.batches.length} tracked batches`} icon={<Boxes size={20} />} />
      <Metric label="Inventory value" value={money(retailValue)} detail="At current selling price" icon={<Store size={20} />} />
      <Metric label="Expiry attention" value={String(data.nearExpiry.length + data.expired.length)} detail={`${data.expired.length} already expired`} icon={<Clock3 size={20} />} tone="amber" />
      <Metric label="Low-stock items" value={String(data.lowStock.length)} detail="Below reorder level" icon={<AlertTriangle size={20} />} tone={data.lowStock.length ? 'red' : 'green'} />
    </section>

    <section className="overview-grid">
      <div className="panel"><PanelHead title="Expiry watchlist" detail={`${activeAlerts} active alert${activeAlerts === 1 ? '' : 's'}`} action="View all" onClick={() => go('Expiry')} />
        <div className="compact-list">{expiryWatch.length ? expiryWatch.map((batch, index) => <button key={`${stringValue(batch, 'BATCH_ID')}-${index}`} onClick={() => go('Expiry')}>
          <span className="list-icon"><Pill size={18} /></span><span><strong>{stringValue(batch, 'MEDICINE_NAME')}</strong><small>{stringValue(batch, 'BATCH_NUMBER')} · {numberValue(batch, 'QUANTITY_AVAILABLE')} units</small></span>
          <StockState expiry={value(batch, 'EXPIRY_DATE')} quantity={value(batch, 'QUANTITY_AVAILABLE')} /><ChevronRight size={17} />
        </button>) : <EmptyInline label="No batches need expiry attention." />}</div>
      </div>
      <div className="panel"><PanelHead title="Recent sales" detail="Latest fulfilled items" action="View ledger" onClick={() => go('Sales')} />
        <div className="compact-list">{recentSales.length ? recentSales.map((sale, index) => <button key={`${stringValue(sale, 'SALE_ID')}-${index}`} onClick={() => go('Sales')}>
          <span className="list-icon green"><ShoppingBag size={18} /></span><span><strong>{stringValue(sale, 'MEDICINE_NAME')}</strong><small>{stringValue(sale, 'CUSTOMER_NAME')} · {numberValue(sale, 'QUANTITY')} units</small></span>
          <b className="list-amount">{money(value(sale, 'SUBTOTAL'))}</b><ChevronRight size={17} />
        </button>) : <EmptyInline label="No sales have been recorded." />}</div>
      </div>
    </section>
  </>;
}

function Metric({ label, value: displayValue, detail, icon, tone = '' }: { label: string; value: string; detail: string; icon: ReactNode; tone?: string }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span>{label}</span><i>{icon}</i></div><strong>{displayValue}</strong><small>{detail}</small></article>;
}
function PanelHead({ title, detail, action, onClick }: { title: string; detail: string; action: string; onClick: () => void }) {
  return <div className="panel-head"><div><h2>{title}</h2><p>{detail}</p></div><button onClick={onClick}>{action}<ArrowRight size={15} /></button></div>;
}
function EmptyInline({ label }: { label: string }) { return <div className="empty-inline"><ClipboardList size={22} /><span>{label}</span></div>; }

type TableSpec = { title: string; description: string; columns: string[]; rows: ReactNode[][]; action?: { label: string; mode?: FormMode; run?: () => void } };
function DataPage({ page, data, search, openForm, refreshAlerts, resolveAlert, editMaster, deleteMaster }: {
  page: Exclude<Page, 'Overview'>; data: Dataset; search: string; openForm: (mode: FormMode) => void;
  refreshAlerts: () => void; resolveAlert: (id: unknown) => Promise<void>;
  editMaster: (kind: 'medicine' | 'supplier', row: Row) => void;
  deleteMaster: (kind: 'medicine' | 'supplier', row: Row) => Promise<void>;
}) {
  let spec: TableSpec;
  if (page === 'Inventory') spec = { title: 'Batch inventory', description: 'Live quantities, prices and expiry positions across every stocked batch.', columns: ['Batch', 'Medicine', 'Supplier', 'Available', 'Price', 'Expiry', 'Status'], rows: data.batches.map(batch => [stringValue(batch, 'BATCH_NUMBER'), stringValue(batch, 'MEDICINE_NAME'), stringValue(batch, 'SUPPLIER_NAME') || '—', numberValue(batch, 'QUANTITY_AVAILABLE'), money(value(batch, 'SELLING_PRICE')), formatDate(value(batch, 'EXPIRY_DATE')), <StockState expiry={value(batch, 'EXPIRY_DATE')} quantity={value(batch, 'QUANTITY_AVAILABLE')} />]), action: { label: 'Receive stock', mode: 'purchase' } };
  else if (page === 'Medicines') spec = { title: 'Medicine catalogue', description: 'Products, categories and reorder thresholds in the active catalogue.', columns: ['Medicine', 'Generic name', 'Category', 'Form', 'Strength', 'Manufacturer', 'Stock', 'Reorder', 'Actions'], rows: data.medicines.map(item => [stringValue(item, 'MEDICINE_NAME'), stringValue(item, 'GENERIC_NAME') || '—', stringValue(item, 'CATEGORY_NAME'), stringValue(item, 'DOSAGE_FORM') || '—', stringValue(item, 'STRENGTH') || '—', stringValue(item, 'MANUFACTURER') || '—', numberValue(item, 'TOTAL_STOCK'), numberValue(item, 'REORDER_LEVEL'), <span className="row-actions"><button title="Edit medicine" aria-label="Edit medicine" onClick={() => editMaster('medicine', item)}><Pencil size={14} /></button><button className="danger-action" title="Delete medicine" aria-label="Delete medicine" onClick={() => void deleteMaster('medicine', item)}><Trash2 size={14} /></button></span>]), action: { label: 'Add medicine', mode: 'medicine' } };
  else if (page === 'Suppliers') spec = { title: 'Suppliers', description: 'Approved vendors and their primary contact information.', columns: ['Supplier', 'Contact person', 'Phone', 'Email', 'Actions'], rows: data.suppliers.map(item => [stringValue(item, 'SUPPLIER_NAME'), stringValue(item, 'CONTACT_PERSON') || '—', stringValue(item, 'PHONE') || '—', stringValue(item, 'EMAIL') || '—', <span className="row-actions"><button title="Edit supplier" aria-label="Edit supplier" onClick={() => editMaster('supplier', item)}><Pencil size={14} /></button><button className="danger-action" title="Delete supplier" aria-label="Delete supplier" onClick={() => void deleteMaster('supplier', item)}><Trash2 size={14} /></button></span>]), action: { label: 'Add supplier', mode: 'supplier' } };
  else if (page === 'Purchases') spec = { title: 'Stock receipts', description: 'Purchase invoices and received quantities from pharmacy suppliers.', columns: ['Receipt', 'Invoice', 'Supplier', 'Date', 'Quantity', 'Total'], rows: data.purchases.map(item => [`#${stringValue(item, 'PURCHASE_ID')}`, stringValue(item, 'INVOICE_NUMBER'), stringValue(item, 'SUPPLIER_NAME'), formatDate(value(item, 'PURCHASE_DATE')), numberValue(item, 'QUANTITY'), money(value(item, 'TOTAL_AMOUNT'))]), action: { label: 'New receipt', mode: 'purchase' } };
  else if (page === 'Sales') spec = { title: 'Sales ledger', description: 'Completed sales with the exact batches used for fulfilment.', columns: ['Sale', 'Medicine', 'Batch', 'Customer', 'Payment', 'Quantity', 'Line total', 'Date'], rows: data.sales.map(item => [`#${stringValue(item, 'SALE_ID')}`, stringValue(item, 'MEDICINE_NAME'), stringValue(item, 'BATCH_NUMBER'), stringValue(item, 'CUSTOMER_NAME'), stringValue(item, 'PAYMENT_METHOD'), numberValue(item, 'QUANTITY'), money(value(item, 'SUBTOTAL')), formatDate(value(item, 'SALE_DATE'))]), action: { label: 'New sale', mode: 'sale' } };
  else if (page === 'Expiry') {
    const expiryRows = data.alerts.map(item => [stringValue(item, 'MEDICINE_NAME'), stringValue(item, 'BATCH_NUMBER'), formatDate(value(item, 'EXPIRY_DATE')), numberValue(item, 'QUANTITY_AVAILABLE'), <StockState expiry={value(item, 'EXPIRY_DATE')} quantity={value(item, 'QUANTITY_AVAILABLE')} />, stringValue(item, 'STATUS') === 'ACTIVE' ? <button className="table-action" onClick={() => void resolveAlert(value(item, 'ALERT_ID'))}>Resolve</button> : <span className="resolved-label">Resolved</span>]);
    spec = { title: 'Expiry centre', description: 'Review active expiry warnings and close alerts after stock is handled.', columns: ['Medicine', 'Batch', 'Expiry', 'Units', 'Position', 'Action'], rows: expiryRows, action: { label: 'Refresh alerts', run: refreshAlerts } };
  } else {
    const reportRows = [
      ...data.lowStock.map(item => ['Low stock', stringValue(item, 'MEDICINE_NAME'), `${numberValue(item, 'TOTAL_STOCK')} units`, `Reorder at ${numberValue(item, 'REORDER_LEVEL')}`, <span className="status-pill danger"><i />Action needed</span>]),
      ...data.expired.map(item => ['Expired stock', stringValue(item, 'MEDICINE_NAME'), stringValue(item, 'BATCH_NUMBER'), formatDate(value(item, 'EXPIRY_DATE')), <span className="status-pill danger"><i />Blocked</span>]),
      ...data.nearExpiry.map(item => ['Near expiry', stringValue(item, 'MEDICINE_NAME'), stringValue(item, 'BATCH_NUMBER'), formatDate(value(item, 'EXPIRY_DATE')), <span className="status-pill warning"><i />Monitor</span>])
    ];
    spec = { title: 'Operational reports', description: 'Exception-based reporting for purchasing and stock-control decisions.', columns: ['Report', 'Medicine', 'Reference', 'Detail', 'Status'], rows: reportRows };
  }

  const query = search.trim().toLowerCase();
  const filtered = query ? spec.rows.filter(row => row.some(cell => typeof cell !== 'object' && String(cell).toLowerCase().includes(query))) : spec.rows;
  return <>
    <section className="page-heading"><div><span className="eyebrow">Pharmacy workspace</span><h1>{spec.title}</h1><p>{spec.description}</p></div>
      {spec.action && <button className="primary-button" onClick={() => spec.action?.run ? spec.action.run() : spec.action?.mode && openForm(spec.action.mode)}><Plus size={17} />{spec.action.label}</button>}
    </section>
    <section className="table-panel"><div className="table-scroll"><table><thead><tr>{spec.columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>{filtered.length ? filtered.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td className="empty-cell" colSpan={spec.columns.length}>{query ? 'No records match your search.' : 'No records to display.'}</td></tr>}</tbody>
    </table></div><div className="table-foot"><span>{filtered.length} record{filtered.length === 1 ? '' : 's'}</span><span>{query ? `Filtered by “${search}”` : 'Live inventory data'}</span></div></section>
  </>;
}

function ActionForm({ mode, data, editRow, onClose, onSuccess }: { mode: FormMode; data: Dataset; editRow: Row | null; onClose: () => void; onSuccess: (message: string) => Promise<void> }) {
  const initialFields: Record<string, string> = editRow ? Object.fromEntries(Object.entries(editRow).map(([key, val]) => [key.toLowerCase(), String(val ?? '')])) : { payment_method: 'CASH' };
  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (name: string, next: string) => setFields(current => ({ ...current, [name]: next }));
  const titles: Record<FormMode, [string, string]> = { sale: ['Record a new sale', 'Stock out'], purchase: ['Receive supplier stock', 'Stock in'], medicine: [editRow ? 'Edit medicine' : 'Add a medicine', 'Catalogue'], supplier: [editRow ? 'Edit supplier' : 'Add a supplier', 'Vendor directory'] };

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setFormError('');
    try {
      let endpoint = `/${mode}s`;
      let payload: Record<string, string | number> = { ...fields };
      if (mode === 'sale') payload = { ...fields, medicine_id: Number(fields.medicine_id), quantity: Number(fields.quantity) };
      if (mode === 'medicine') payload = { ...fields, category_id: Number(fields.category_id), reorder_level: Number(fields.reorder_level || 10) };
      if (mode === 'purchase') payload = { ...fields, supplier_id: Number(fields.supplier_id), medicine_id: Number(fields.medicine_id), quantity: Number(fields.quantity), unit_price: Number(fields.unit_price), selling_price: Number(fields.selling_price) };
      const id = editRow ? Number(value(editRow, mode === 'medicine' ? 'MEDICINE_ID' : 'SUPPLIER_ID')) : null;
      if (editRow && (mode === 'medicine' || mode === 'supplier')) endpoint += `/${id}`;
      const result = await api<{ message: string }>(endpoint, { method: editRow ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      await onSuccess(result.message);
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Unable to save the record'); }
    finally { setSaving(false); }
  }

  return <Modal title={titles[mode][0]} eyebrow={titles[mode][1]} onClose={onClose}><form onSubmit={submit}>
    <div className="form-grid">
      {mode === 'supplier' && <><Field initial={fields.supplier_name} name="supplier_name" label="Supplier name" set={set} /><Field initial={fields.contact_person} name="contact_person" label="Contact person" set={set} required={false} /><Field initial={fields.phone} name="phone" label="Phone" type="tel" set={set} required={false} /><Field initial={fields.email} name="email" label="Email" type="email" set={set} required={false} /></>}
      {mode === 'medicine' && <><Field initial={fields.medicine_name} name="medicine_name" label="Medicine name" set={set} /><Field initial={fields.generic_name} name="generic_name" label="Generic name" set={set} required={false} /><SelectField initial={fields.category_id} name="category_id" label="Category" rows={data.categories} idKey="CATEGORY_ID" labelKey="CATEGORY_NAME" set={set} /><Field initial={fields.manufacturer} name="manufacturer" label="Manufacturer" set={set} required={false} /><Field initial={fields.dosage_form} name="dosage_form" label="Dosage form" set={set} required={false} /><Field initial={fields.strength} name="strength" label="Strength" set={set} required={false} /><Field initial={fields.reorder_level} name="reorder_level" label="Reorder level" type="number" min="0" set={set} /></>}
      {mode === 'sale' && <><SelectField name="medicine_id" label="Medicine" rows={data.medicines} idKey="MEDICINE_ID" labelKey="MEDICINE_NAME" set={set} /><Field name="customer_name" label="Customer" placeholder="Walk-in Customer" set={set} required={false} /><Field name="customer_phone" label="Customer phone" type="tel" set={set} required={false} /><Field name="customer_email" label="Customer email" type="email" set={set} required={false} /><Field name="quantity" label="Quantity" type="number" min="1" set={set} /><label><span>Payment method</span><select value={fields.payment_method} onChange={event => set('payment_method', event.target.value)}><option>CASH</option><option>UPI</option><option>CARD</option><option>OTHER</option></select></label></>}
      {mode === 'purchase' && <><SelectField name="supplier_id" label="Supplier" rows={data.suppliers} idKey="SUPPLIER_ID" labelKey="SUPPLIER_NAME" set={set} /><SelectField name="medicine_id" label="Medicine" rows={data.medicines} idKey="MEDICINE_ID" labelKey="MEDICINE_NAME" set={set} /><Field name="invoice_number" label="Invoice number" set={set} /><Field name="batch_number" label="Batch number" set={set} /><Field name="manufacture_date" label="Manufacture date" type="date" set={set} /><Field name="expiry_date" label="Expiry date" type="date" set={set} /><Field name="quantity" label="Quantity" type="number" min="1" set={set} /><Field name="unit_price" label="Purchase price" type="number" min="0" step="0.01" set={set} /><Field name="selling_price" label="Selling price" type="number" min="0" step="0.01" set={set} /></>}
    </div>
    {formError && <div className="form-error"><AlertTriangle size={16} />{formError}</div>}
    <div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save record'}</button></div>
  </form></Modal>;
}

function Field({ name, label, type = 'text', required = true, min, step, placeholder, initial = '', set }: { name: string; label: string; type?: string; required?: boolean; min?: string; step?: string; placeholder?: string; initial?: string; set: (name: string, value: string) => void }) {
  return <label><span>{label}</span><input required={required} type={type} min={min} step={step} placeholder={placeholder} defaultValue={initial} onChange={event => set(name, event.target.value)} /></label>;
}
function SelectField({ name, label, rows, idKey, labelKey, initial = '', set }: { name: string; label: string; rows: Row[]; idKey: string; labelKey: string; initial?: string; set: (name: string, value: string) => void }) {
  return <label><span>{label}</span><select required defaultValue={initial} onChange={event => set(name, event.target.value)}><option value="" disabled>Select {label.toLowerCase()}</option>{rows.map(row => <option key={stringValue(row, idKey)} value={stringValue(row, idKey)}>{stringValue(row, labelKey)}</option>)}</select></label>;
}

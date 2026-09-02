import { isValidElement, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Filter,
  Menu,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { batches, daysLeft, medicines, sales, suppliers } from './data';

type Page = 'Overview' | 'Medicines' | 'Batches' | 'Suppliers' | 'Purchases' | 'Sales' | 'Expiry' | 'Reports';
type ActionMode = 'Receive stock' | 'New sale' | 'Add medicine' | 'Add supplier' | 'New purchase';
type Cell = string | number | ReactNode;

const navigation: Page[] = ['Overview', 'Medicines', 'Batches', 'Suppliers', 'Purchases', 'Sales', 'Expiry', 'Reports'];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
}

function today(format: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-IN', format).format(new Date());
}

function nodeText(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(nodeText).join(' ');
  if (isValidElement<{ children?: ReactNode }>(value)) return nodeText(value.props.children);
  return '';
}

function BatchState({ expiry }: { expiry: string }) {
  const days = daysLeft(expiry);
  const label = days < 0 ? 'Expired' : days <= 30 ? 'Due soon' : 'Clear';
  return <span className={`batch-state ${days < 0 ? 'expired' : days <= 30 ? 'due' : 'clear'}`}><i />{label}</span>;
}

function PageIntro({ label, title, description, action, onAction }: { label: string; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="page-intro">
    <div><span className="section-label">{label}</span><h1>{title}</h1><p>{description}</p></div>
    {action && <button className="solid-action" onClick={onAction}><Plus size={16} />{action}</button>}
  </div>;
}

function BatchHorizon({ go }: { go: (page: Page) => void }) {
  const buckets = [
    { label: 'Past due', note: 'Remove from sale', tone: 'danger', rows: batches.filter(batch => daysLeft(batch.expiry) < 0) },
    { label: 'Next 30 days', note: 'Prioritise by FEFO', tone: 'warning', rows: batches.filter(batch => daysLeft(batch.expiry) >= 0 && daysLeft(batch.expiry) <= 30) },
    { label: '31-90 days', note: 'Watch closely', tone: 'watch', rows: batches.filter(batch => daysLeft(batch.expiry) > 30 && daysLeft(batch.expiry) <= 90) },
    { label: 'Beyond 90 days', note: 'No immediate risk', tone: 'clear', rows: batches.filter(batch => daysLeft(batch.expiry) > 90) },
  ];

  return <section className="horizon-block">
    <div className="block-heading">
      <div><span>Batch horizon</span><h2>Expiry position</h2></div>
      <button onClick={() => go('Expiry')}>Open expiry register <ArrowRight size={15} /></button>
    </div>
    <div className="horizon-grid">
      {buckets.map(bucket => <div className={`horizon-column ${bucket.tone}`} key={bucket.label}>
        <div className="horizon-head"><strong>{bucket.rows.length}</strong><div><b>{bucket.label}</b><small>{bucket.note}</small></div></div>
        <div className="horizon-rows">
          {bucket.rows.length === 0 && <div className="empty-horizon"><Check size={15} /><span>No batches</span></div>}
          {bucket.rows.slice(0, 3).map(batch => <button key={batch.id} onClick={() => go('Batches')}>
            <span><b>{batch.batch}</b><small>{batch.medicine}</small></span>
            <span><b>{batch.available}</b><small>units</small></span>
          </button>)}
        </div>
      </div>)}
    </div>
  </section>;
}

function Dashboard({ go, openAction }: { go: (page: Page) => void; openAction: (mode: ActionMode) => void }) {
  const atRisk = batches.filter(batch => daysLeft(batch.expiry) <= 30);
  const totalUnits = batches.reduce((sum, batch) => sum + batch.available, 0);
  const stockValue = batches.reduce((sum, batch) => sum + batch.available * batch.price, 0);

  return <>
    <PageIntro
      label="Daily stock desk"
      title="MG Road inventory"
      description={`${today({ weekday: 'long', day: '2-digit', month: 'long' })} / Last reconciliation at 09:15`}
      action="Receive delivery"
      onAction={() => openAction('Receive stock')}
    />

    <section className="ledger-summary">
      <div><span>On hand</span><strong>{totalUnits.toLocaleString('en-IN')}</strong><small>units</small></div>
      <div><span>Stock value</span><strong>Rs {stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong><small>at cost</small></div>
      <div><span>Active batches</span><strong>{batches.length}</strong><small>across {medicines.length} medicines</small></div>
      <button onClick={() => go('Expiry')}><span>Exceptions</span><strong>{atRisk.length}</strong><small>{atRisk.filter(batch => daysLeft(batch.expiry) < 0).length} cannot be sold</small><ArrowRight size={18} /></button>
    </section>

    <div className="operations-layout">
      <BatchHorizon go={go} />
      <aside className="work-queue">
        <div className="queue-heading"><span>Today</span><strong>Action queue</strong><small>3 items require review</small></div>
        <div className="queue-list">
          <button onClick={() => go('Expiry')}><em>01</em><span><b>Quarantine AMX-2023-B1</b><small>40 units expired 15 days ago</small></span><i className="critical" /></button>
          <button onClick={() => go('Expiry')}><em>02</em><span><b>Prioritise PCM-2024-A2</b><small>90 units expire in 10 days</small></span><i className="priority" /></button>
          <button onClick={() => go('Purchases')}><em>03</em><span><b>Review insulin reorder</b><small>60 vials remain in stock</small></span><i /></button>
        </div>
        <button className="queue-action" onClick={() => openAction('New sale')}>Start a sale <ArrowRight size={16} /></button>
      </aside>
    </div>

    <section className="inventory-ledger">
      <div className="block-heading ledger-heading">
        <div><span>Stock ledger</span><h2>Inventory by medicine</h2></div>
        <div className="heading-actions"><button><Download size={15} /> Export</button><button onClick={() => go('Medicines')}>Full catalog <ArrowRight size={15} /></button></div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Medicine</th><th>Manufacturer</th><th>Batches</th><th>Next expiry</th><th className="numeric">On hand</th><th>Position</th></tr></thead>
          <tbody>{medicines.map(medicine => {
            const stockBatches = batches.filter(batch => batch.medicine === medicine.name);
            const nextBatch = [...stockBatches].sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
            return <tr key={medicine.id}>
              <td><span className="medicine-id">M{String(medicine.id).padStart(3, '0')}</span><b>{medicine.name}</b><small>{medicine.category} / {medicine.unit}</small></td>
              <td>{medicine.manufacturer}</td><td>{stockBatches.length}</td>
              <td>{nextBatch ? <><b>{formatDate(nextBatch.expiry)}</b><small>{nextBatch.batch}</small></> : '-'}</td>
              <td className="numeric"><b>{medicine.stock}</b></td>
              <td>{nextBatch ? <BatchState expiry={nextBatch.expiry} /> : '-'}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="ledger-foot"><span>Showing all {medicines.length} medicines</span><span><i /> Live stock position</span></div>
    </section>

    <section className="transaction-strip">
      <div><span>Latest transaction</span><strong>{sales[0].id} / {sales[0].medicine}</strong><small>{sales[0].qty} units allocated from {sales[0].batch} using FEFO</small></div>
      <div><span>Customer</span><strong>{sales[0].customer}</strong><small>{sales[0].date}</small></div>
      <div><span>Sale value</span><strong>Rs {sales[0].total.toFixed(2)}</strong><small>Completed</small></div>
      <button onClick={() => go('Sales')}>View transaction ledger <ArrowRight size={16} /></button>
    </section>
  </>;
}

const listingContent: Record<Exclude<Page, 'Overview'>, { label: string; description: string; action?: ActionMode; headers: string[]; rows: Cell[][] }> = {
  Medicines: {
    label: 'Master data', description: 'Product identity, pack format, manufacturer and current stock.', action: 'Add medicine',
    headers: ['Code', 'Medicine', 'Category', 'Manufacturer', 'Pack', 'On hand'],
    rows: medicines.map(medicine => [`M${String(medicine.id).padStart(3, '0')}`, <><b>{medicine.name}</b><small>Active product</small></>, medicine.category, medicine.manufacturer, medicine.unit, <b>{medicine.stock}</b>]),
  },
  Batches: {
    label: 'Traceability', description: 'Every received batch, its source, remaining quantity and expiry.', action: 'Receive stock',
    headers: ['Batch', 'Medicine', 'Supplier', 'Received', 'Available', 'Expiry', 'Position'],
    rows: batches.map(batch => [<b>{batch.batch}</b>, batch.medicine, batch.supplier, batch.received, <b>{batch.available}</b>, formatDate(batch.expiry), <BatchState expiry={batch.expiry} />]),
  },
  Suppliers: {
    label: 'Supply directory', description: 'Approved suppliers and their current relationship with the branch.', action: 'Add supplier',
    headers: ['Supplier', 'Contact', 'Phone', 'Email', 'Batches'],
    rows: suppliers.map(supplier => [<><b>{supplier.name}</b><small>S{String(supplier.id).padStart(3, '0')}</small></>, supplier.contact, supplier.phone, supplier.email, supplier.batches]),
  },
  Purchases: {
    label: 'Inbound ledger', description: 'Recorded deliveries with supplier, batch and purchase cost.', action: 'New purchase',
    headers: ['Batch', 'Medicine', 'Supplier', 'Quantity', 'Unit cost', 'Status'],
    rows: batches.map(batch => [<b>{batch.batch}</b>, batch.medicine, batch.supplier, batch.received, `Rs ${batch.price.toFixed(2)}`, <span className="recorded">Recorded</span>]),
  },
  Sales: {
    label: 'Transaction ledger', description: 'Completed sales and the batches selected by FEFO.', action: 'New sale',
    headers: ['Sale', 'Medicine', 'Allocated batch', 'Customer', 'Quantity', 'Total', 'Time'],
    rows: sales.map(sale => [<b>{sale.id}</b>, sale.medicine, <><b>{sale.batch}</b><small>FEFO allocation</small></>, sale.customer, sale.qty, `Rs ${sale.total.toFixed(2)}`, sale.date]),
  },
  Expiry: {
    label: 'Exception register', description: 'Expired stock and batches entering the 30-day action window.',
    headers: ['Batch', 'Medicine', 'Supplier', 'Expiry', 'Days', 'Units at risk', 'Position'],
    rows: batches.filter(batch => daysLeft(batch.expiry) <= 30).map(batch => [<b>{batch.batch}</b>, batch.medicine, batch.supplier, formatDate(batch.expiry), daysLeft(batch.expiry), batch.available, <BatchState expiry={batch.expiry} />]),
  },
  Reports: {
    label: 'Saved reports', description: 'Repeatable operational reports for review, audit and submission.',
    headers: ['Report', 'Purpose', 'Records', 'Generated', ''],
    rows: [
      ['Batch stock position', 'Quantity and value for each received batch', batches.length, 'Today, 09:15', <button className="open-row">Open <ArrowRight size={14} /></button>],
      ['Near-expiry register', 'Batches within the next 30 days', batches.filter(batch => daysLeft(batch.expiry) >= 0 && daysLeft(batch.expiry) <= 30).length, 'Today, 09:15', <button className="open-row">Open <ArrowRight size={14} /></button>],
      ['Expired stock', 'Unsaleable batches with remaining quantity', batches.filter(batch => daysLeft(batch.expiry) < 0).length, 'Today, 09:15', <button className="open-row">Open <ArrowRight size={14} /></button>],
      ['Sales by batch', 'Quantity and revenue by FEFO allocation', sales.length, 'Today, 11:24', <button className="open-row">Open <ArrowRight size={14} /></button>],
      ['Supplier exposure', 'Received stock and expiry risk by source', suppliers.length, 'Yesterday', <button className="open-row">Open <ArrowRight size={14} /></button>],
    ],
  },
};

function Listing({ page, openAction, notify }: { page: Exclude<Page, 'Overview'>; openAction: (mode: ActionMode) => void; notify: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('All records');
  const content = listingContent[page];
  const rows = content.rows.filter(row => row.map(nodeText).join(' ').toLowerCase().includes(query.toLowerCase()));

  return <>
    <PageIntro label={content.label} title={page} description={content.description} action={content.action} onAction={content.action ? () => openAction(content.action!) : undefined} />
    <section className="data-register">
      <div className="register-tabs">
        {['All records', 'Needs attention', 'Archived'].map(tab => <button className={view === tab ? 'active' : ''} onClick={() => setView(tab)} key={tab}>{tab}{tab === 'All records' && <span>{content.rows.length}</span>}</button>)}
      </div>
      <div className="register-tools">
        <label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${page.toLowerCase()}`} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label>
        <button><Filter size={15} /> Filter <ChevronDown size={13} /></button>
        <button onClick={() => notify(`${page} export prepared`)}><Download size={15} /> Export</button>
      </div>
      <div className="table-scroll register-table">
        <table><thead><tr>{content.headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>
      </div>
      <div className="register-foot"><span>{rows.length} of {content.rows.length} records</span><span>Branch: MG Road / Updated just now</span></div>
    </section>
  </>;
}

const actionFields: Record<ActionMode, { label: string; type?: string; options?: string[] }[]> = {
  'Receive stock': [
    { label: 'Medicine', options: medicines.map(medicine => medicine.name) }, { label: 'Batch number' }, { label: 'Supplier', options: suppliers.map(supplier => supplier.name) }, { label: 'Expiry date', type: 'date' }, { label: 'Quantity', type: 'number' },
  ],
  'New purchase': [
    { label: 'Supplier', options: suppliers.map(supplier => supplier.name) }, { label: 'Invoice number' }, { label: 'Medicine', options: medicines.map(medicine => medicine.name) }, { label: 'Quantity', type: 'number' }, { label: 'Unit cost', type: 'number' },
  ],
  'New sale': [
    { label: 'Medicine', options: medicines.map(medicine => medicine.name) }, { label: 'Customer' }, { label: 'Quantity', type: 'number' },
  ],
  'Add medicine': [
    { label: 'Medicine name' }, { label: 'Category' }, { label: 'Manufacturer' }, { label: 'Pack format' },
  ],
  'Add supplier': [
    { label: 'Supplier name' }, { label: 'Contact person' }, { label: 'Phone', type: 'tel' }, { label: 'Email', type: 'email' },
  ],
};

function ActionDialog({ mode, onClose, onComplete }: { mode: ActionMode; onClose: () => void; onComplete: (message: string) => void }) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onComplete(`${mode} recorded successfully`);
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.currentTarget === event.target && onClose()}>
    <form className="action-dialog" onSubmit={submit}>
      <div className="dialog-head"><div><span>MG Road Pharmacy</span><h2>{mode}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      {mode === 'New sale' && <div className="fefo-note"><ShieldCheck size={17} /><div><b>FEFO allocation is active</b><small>The earliest eligible batch will be selected automatically.</small></div></div>}
      <div className="form-grid">{actionFields[mode].map(field => <label key={field.label}><span>{field.label}</span>{field.options ? <select required>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input required type={field.type || 'text'} placeholder={field.type === 'number' ? '0' : ''} />}</label>)}</div>
      <div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Confirm {mode.toLowerCase()}</button></div>
    </form>
  </div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [navOpen, setNavOpen] = useState(false);
  const [action, setAction] = useState<ActionMode | null>(null);
  const [toast, setToast] = useState('');
  const exceptionCount = useMemo(() => batches.filter(batch => daysLeft(batch.expiry) <= 30).length, []);

  function navigate(next: Page) { setPage(next); setNavOpen(false); }
  function notify(message: string) {
    setAction(null); setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }

  return <div className="site-shell">
    <header className="masthead">
      <div className="masthead-main">
        <button className="nav-toggle" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle navigation"><Menu size={20} /></button>
        <button className="wordmark" onClick={() => navigate('Overview')}><span>PB</span><div><strong>PharmaBatch</strong><small>Stock control</small></div></button>
        <span className="header-rule" />
        <button className="branch-button"><span>MG Road Pharmacy</span><small>Branch 01</small><ChevronDown size={14} /></button>
        <label className="header-search"><Search size={16} /><input placeholder="Search medicine or batch" /><kbd>/</kbd></label>
        <div className="sync-status"><i /><span><b>Live</b><small>Synced 2m ago</small></span></div>
        <button className="new-sale" onClick={() => setAction('New sale')}><Plus size={16} /> New sale</button>
        <button className="account-button"><span>GC</span><div><b>George</b><small>Admin</small></div><ChevronDown size={14} /></button>
      </div>
      <nav className={`primary-nav ${navOpen ? 'open' : ''}`}>{navigation.map(item => <button className={page === item ? 'active' : ''} onClick={() => navigate(item)} key={item}>{item}{item === 'Expiry' && <em>{exceptionCount}</em>}</button>)}</nav>
    </header>

    <main className="workspace">
      {page === 'Overview' ? <Dashboard go={navigate} openAction={setAction} /> : <Listing page={page} openAction={setAction} notify={notify} />}
    </main>

    {action && <ActionDialog mode={action} onClose={() => setAction(null)} onComplete={notify} />}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </div>;
}

const MONEY_EXPENSE_KEY = 'panel-next-money-expenses-v1';

export function localDateISO(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10);
}

function normalizeExpense(row = {}) {
  const amount = Number(row.amount || 0);
  return {
    ...row,
    id:String(row.id || ''),
    concept:String(row.concept || '').trim(),
    category:String(row.category || 'Otros').trim(),
    amount:Number.isFinite(amount) ? amount : 0,
    payment:String(row.payment || '').trim(),
    date:String(row.date || localDateISO()),
    note:String(row.note || '').trim(),
    createdAt:Number(row.createdAt || Date.now())
  };
}

function readExpenses() {
  try {
    const raw = localStorage.getItem(MONEY_EXPENSE_KEY);
    return raw ? JSON.parse(raw).map(normalizeExpense) : [];
  } catch {
    return [];
  }
}

function writeExpenses(rows) {
  const normalized = rows.map(normalizeExpense);
  localStorage.setItem(MONEY_EXPENSE_KEY, JSON.stringify(normalized));
  return normalized;
}

function nextId(rows) {
  const next = rows.reduce((max,row)=>Math.max(max,Number(String(row.id || '').replace(/\D/g,'')) || 0),1000) + 1;
  return `G-${next}`;
}

export const ManualExpenseStore = {
  list() {
    return readExpenses().sort((a,b)=>(b.createdAt || 0)-(a.createdAt || 0));
  },
  today() {
    const today = localDateISO();
    return this.list().filter(row=>row.date === today);
  },
  create(payload = {}) {
    const rows = readExpenses();
    const amount = Number(payload.amount || 0);
    if (!String(payload.concept || '').trim()) return null;
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const created = normalizeExpense({
      ...payload,
      id:nextId(rows),
      amount,
      createdAt:Date.now()
    });
    rows.unshift(created);
    writeExpenses(rows);
    return created;
  },
  remove(id) {
    const rows = readExpenses().filter(row=>row.id !== id);
    return writeExpenses(rows);
  },
  reset() {
    return writeExpenses([]);
  }
};

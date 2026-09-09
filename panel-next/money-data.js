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

// Pedidos: filtro local visible HOY / MAÑANA, fecha real de entrega
// y orden cronológico por hora de entrega.
(() => {
  let selectedDay = 'today';
  let applying = false;

  function addDaysISO(iso, days) {
    const [y,m,d] = String(iso).split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    date.setDate(date.getDate() + days);
    return localDateISO(date);
  }

  function formatDate(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso || '—');
  }

  function parseDisplayedDate(value) {
    const raw = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const es = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (es) return `${es[3]}-${es[2]}-${es[1]}`;
    if (raw.toLowerCase() === 'hoy') return new Date().toISOString().slice(0,10);
    return '';
  }

  function deliveryBlock(card) {
    return [...card.querySelectorAll('.order-info-grid > div')]
      .find(block => block.querySelector('small')?.textContent.trim().toLowerCase().includes('entrega')) || null;
  }

  function normalizeCardDate(card) {
    const block = deliveryBlock(card);
    const strong = block?.querySelector('strong');
    if (!strong) return card.dataset.deliveryDate || '';

    const pieces = strong.textContent.split('·');
    const datePart = (pieces.shift() || '').trim();
    const timePart = pieces.join('·').trim();
    const iso = card.dataset.deliveryDate || parseDisplayedDate(datePart);
    if (!iso) return '';

    card.dataset.deliveryDate = iso;
    card.dataset.deliveryTime = timePart || card.dataset.deliveryTime || '';
    block.classList.add('delivery-date-highlight');
    const label = block.querySelector('small');
    if (label && label.textContent !== 'FECHA DE ENTREGA') label.textContent = 'FECHA DE ENTREGA';
    const nextText = `${formatDate(iso)}${timePart ? ` · ${timePart}` : ''}`;
    if (strong.textContent !== nextText) strong.textContent = nextText;
    return iso;
  }

  function timeMinutes(value) {
    const raw = String(value || '').trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return 24 * 60 + 1;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function sortCardsChronologically(cards, list) {
    const sorted = [...cards].sort((a,b) => {
      const dateA = a.dataset.deliveryDate || normalizeCardDate(a);
      const dateB = b.dataset.deliveryDate || normalizeCardDate(b);
      if (dateA !== dateB) return String(dateA).localeCompare(String(dateB));
      return timeMinutes(a.dataset.deliveryTime) - timeMinutes(b.dataset.deliveryTime);
    });

    const current = [...list.querySelectorAll('.order-card')];
    const changed = sorted.some((card,index) => card !== current[index]);
    if (changed) sorted.forEach(card => list.appendChild(card));
    return sorted;
  }

  function targetISO() {
    const today = localDateISO();
    return selectedDay === 'tomorrow' ? addDaysISO(today, 1) : today;
  }

  function refreshButtonDates() {
    const today = localDateISO();
    const tomorrow = addDaysISO(today, 1);
    const t = document.querySelector('[data-local-order-day="today"] .order-day-date');
    const m = document.querySelector('[data-local-order-day="tomorrow"] .order-day-date');
    if (t) t.textContent = formatDate(today).slice(0,5);
    if (m) m.textContent = formatDate(tomorrow).slice(0,5);
  }

  function applyDayFilter() {
    if (applying) return;
    applying = true;
    try {
      const list = document.querySelector('#ordersList');
      if (!list) return;
      const target = targetISO();
      let cards = [...list.querySelectorAll('.order-card')];
      let visible = 0;

      list.querySelector('#localDayEmpty')?.remove();
      cards.forEach(card => normalizeCardDate(card));
      cards = sortCardsChronologically(cards, list);

      cards.forEach(card => {
        const iso = card.dataset.deliveryDate || normalizeCardDate(card);
        const show = iso === target;
        card.hidden = !show;
        if (show) visible += 1;
      });

      const today = localDateISO();
      const tomorrow = addDaysISO(today,1);
      const counts = {today:0,tomorrow:0};
      cards.forEach(card => {
        const iso = card.dataset.deliveryDate || normalizeCardDate(card);
        if (iso === today) counts.today += 1;
        if (iso === tomorrow) counts.tomorrow += 1;
      });
      document.querySelector('[data-local-order-day="today"] .order-day-count')?.replaceChildren(document.createTextNode(String(counts.today)));
      document.querySelector('[data-local-order-day="tomorrow"] .order-day-count')?.replaceChildren(document.createTextNode(String(counts.tomorrow)));

      if (!visible && cards.length) {
        const empty = document.createElement('div');
        empty.id = 'localDayEmpty';
        empty.className = 'orders-empty';
        empty.innerHTML = `<span>📋</span><h3>No hay pedidos ${selectedDay === 'tomorrow' ? 'mañana' : 'hoy'}</h3>`;
        list.appendChild(empty);
      }
    } finally {
      applying = false;
    }
  }

  function setSelected(day) {
    selectedDay = day;
    document.querySelectorAll('[data-local-order-day]').forEach(button => {
      button.classList.toggle('active', button.dataset.localOrderDay === day);
    });
    applyDayFilter();
  }

  function installStyles() {
    if (document.querySelector('#localOrderDayStyles')) return;
    const style = document.createElement('style');
    style.id = 'localOrderDayStyles';
    style.textContent = `
      #orderDayFilter{display:none!important}
      .order-day-buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px}
      .order-day-button{position:relative;border:2px solid #078844;background:#fff;color:#123228;border-radius:17px;min-height:64px;padding:10px 42px 9px 13px;font-size:18px;font-weight:1000;line-height:1.05;text-align:left;box-shadow:0 5px 14px rgba(0,0,0,.08)}
      .order-day-button.active{background:#078844;color:#fff;border-color:#078844}
      .order-day-button .order-day-date{display:block;margin-top:6px;font-size:13px;font-weight:900;opacity:.8}
      .order-day-button .order-day-count{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:grid;place-items:center;min-width:30px;height:30px;padding:0 7px;border-radius:999px;background:#111;color:#fff;font-size:15px}
      .order-day-button.active .order-day-count{background:#fff;color:#078844}
      .delivery-date-highlight{grid-column:1/-1!important;background:#eef9f2;border:2px solid #078844;border-radius:14px;padding:10px 12px!important}
      .delivery-date-highlight small{color:#078844!important;font-size:12px!important;font-weight:1000!important}
      .delivery-date-highlight strong{display:block;margin-top:3px;font-size:20px!important;font-weight:1000!important;color:#17231e!important}
      @media(max-width:520px){.order-day-button{font-size:17px;min-height:66px;padding-left:12px}}
    `;
    document.head.appendChild(style);
  }

  function installButtons() {
    installStyles();
    const toolbar = document.querySelector('.orders-toolbar');
    const select = document.querySelector('#orderDayFilter');
    if (!toolbar || !select) return false;

    if (select.value !== 'all') {
      select.value = 'all';
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }

    if (!document.querySelector('#localOrderDayButtons')) {
      const wrap = document.createElement('div');
      wrap.id = 'localOrderDayButtons';
      wrap.className = 'order-day-buttons';
      wrap.innerHTML = `
        <button class="order-day-button active" type="button" data-local-order-day="today">
          PEDIDOS HOY <span class="order-day-date"></span><span class="order-day-count">0</span>
        </button>
        <button class="order-day-button" type="button" data-local-order-day="tomorrow">
          PEDIDOS MAÑANA <span class="order-day-date"></span><span class="order-day-count">0</span>
        </button>`;
      toolbar.insertAdjacentElement('afterend',wrap);
      wrap.addEventListener('click',event => {
        const button = event.target.closest('[data-local-order-day]');
        if (!button) return;
        setSelected(button.dataset.localOrderDay);
      });
    }

    refreshButtonDates();
    applyDayFilter();
    return true;
  }

  function boot() {
    if (!installButtons()) {
      setTimeout(boot,100);
      return;
    }
    const list = document.querySelector('#ordersList');
    if (list && !list.dataset.localDayObserver) {
      list.dataset.localDayObserver = '1';
      const observer = new MutationObserver(() => {
        if (!applying) requestAnimationFrame(applyDayFilter);
      });
      observer.observe(list,{childList:true,subtree:true});
    }
    window.addEventListener('panel:orders-changed',()=>requestAnimationFrame(applyDayFilter));
  }

  requestAnimationFrame(boot);
})();

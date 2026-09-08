import { BUSINESS, MODULES } from './config.js';
import { OrdersStore, MenuStore, InventoryStore } from './data.js';
import { RecipeStore } from './recipes-data.js';
import { PurchaseStore } from './purchases-data.js';
import { ManualExpenseStore, localDateISO } from './money-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = new Intl.NumberFormat(BUSINESS.locale || 'es-US', { style:'currency', currency:BUSINESS.currency || 'USD' });
const PROFILE_KEY = 'panel-next-profile-v1';
const SETTINGS_KEY = 'panel-next-settings-v1';

let connectionState = 'conectando';
let connectionMessage = '';
let shellSection = null;
let drawer = null;
let reportDays = 7;

function ensureStyles() {
  if (!document.querySelector('link[data-admin-shell]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './admin-shell.css?v=20260907-1840';
    link.dataset.adminShell = '1';
    document.head.appendChild(link);
  }

  if ($('#adminSuiteStyles')) return;
  const style = document.createElement('style');
  style.id = 'adminSuiteStyles';
  style.textContent = `
    .shell-form select,.shell-form textarea{display:block;width:100%;margin-top:6px;border:1px solid #d6dfda;border-radius:14px;padding:0 12px;font-size:17px;background:#fff;color:#17211c}
    .shell-form select{min-height:52px}.shell-form textarea{min-height:96px;padding-top:12px;resize:vertical;line-height:1.4}
    .shell-form label.full{grid-column:1/-1}.shell-form .field-note{display:block;margin-top:5px;color:#7a8780;font-size:11px;font-weight:700;text-transform:none}
    .settings-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 0}.settings-summary div{border-radius:13px;background:#f4f7f5;padding:11px}.settings-summary small{display:block;color:#728078;font-size:10px;font-weight:1000;text-transform:uppercase}.settings-summary strong{display:block;margin-top:5px;font-size:20px}
    .report-period{display:flex;gap:7px}.report-period button{border:1px solid #dce5e0;background:#fff;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:900}.report-period button.active{background:#111;color:#fff;border-color:#111}
    .report-highlight{display:grid;grid-template-columns:1fr 1fr;gap:9px}.report-mini{border-radius:15px;background:#f5f8f6;padding:13px}.report-mini small{display:block;color:#738079;font-size:10px;font-weight:1000;text-transform:uppercase}.report-mini strong{display:block;margin-top:5px;font-size:19px}.report-mini span{display:block;margin-top:4px;color:#65726b;font-size:12px}
    .menu-config-row .menu-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.menu-chip{display:inline-flex;border-radius:999px;background:#eef4f1;padding:5px 8px;color:#53635b;font-size:11px;font-weight:900}
    .profile-note{border-radius:14px;background:#fff8dd;border:1px solid #f0df9c;padding:12px 13px;color:#655a2e;font-size:13px;line-height:1.4}
    .shell-subtitle{margin:-4px 0 14px;color:#6d7972;font-size:14px;line-height:1.4}
    @media(max-width:720px){
      .settings-summary{grid-template-columns:1fr 1fr}.report-highlight{grid-template-columns:1fr}.shell-form label.full{grid-column:1}.shell-card-head{gap:8px}.report-period{flex-wrap:wrap}
    }
  `;
  document.head.appendChild(style);
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function profile() {
  return readJson(PROFILE_KEY, {
    name:'Administrador',
    role:'Administrador',
    phone:'',
    email:''
  });
}

function settings() {
  return readJson(SETTINGS_KEY, {
    businessName:BUSINESS.name || 'El Cubano',
    businessType:'',
    phone:'',
    whatsapp:'',
    address:'',
    city:'',
    region:'',
    zip:'',
    notes:''
  });
}

function today() {
  return localDateISO();
}

function orderIsToday(order) {
  return String(order.date || '') === today();
}

function activeToday() {
  return OrdersStore.list().filter(order => orderIsToday(order) && !['delivered','cancelled'].includes(order.status));
}

function fixOrderBadges() {
  const count = activeToday().length;
  const card = document.querySelector('.module-card[data-module="pedidos"]');
  if (card) {
    let badge = card.querySelector('.module-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'module-badge';
        card.prepend(badge);
      }
      badge.textContent = String(count);
      badge.hidden = false;
    } else if (badge) {
      badge.remove();
    }
  }

  const bell = document.querySelector('.badge-notify');
  if (bell) {
    bell.textContent = String(count);
    bell.hidden = count === 0;
  }
}

function ensureShell() {
  ensureStyles();
  if (!shellSection) {
    shellSection = document.createElement('section');
    shellSection.id = 'adminShellView';
    shellSection.className = 'admin-shell-view';
    document.querySelector('main.content')?.appendChild(shellSection);
  }

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'adminDrawer';
    drawer.className = 'admin-drawer';
    drawer.hidden = true;
    drawer.innerHTML = '<div class="admin-drawer-backdrop" data-drawer-close></div><aside class="admin-drawer-panel" id="adminDrawerPanel"></aside>';
    document.body.appendChild(drawer);
  }
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1900);
}

function closeDrawer() {
  if (!drawer) return;
  drawer.hidden = true;
  document.body.classList.remove('drawer-open');
}

function menuHtml() {
  const p = profile();
  const cfg = settings();
  const modules = MODULES.map(module => `
    <button class="drawer-item" type="button" data-shell-module="${module.id}">
      <span>${module.icon}</span><b>${module.label}</b>
    </button>`).join('');

  return `
    <div class="drawer-head">
      <div class="drawer-brand">
        <img src="${BUSINESS.logo}" alt="">
        <div>
          <small>${escapeHtml(cfg.businessName || BUSINESS.name || 'NEGOCIO')}</small>
          <strong>${escapeHtml(p.name || 'Administrador')}</strong>
        </div>
      </div>
      <button class="drawer-close" type="button" data-drawer-close>×</button>
    </div>
    <div class="drawer-section-title">Operación</div>
    <div class="drawer-grid">${modules}</div>
    <div class="drawer-section-title">Sistema</div>
    <div class="drawer-grid drawer-grid-system">
      <button class="drawer-item" type="button" data-shell-view="reportes"><span>▥</span><b>Reportes</b></button>
      <button class="drawer-item" type="button" data-shell-view="configuracion"><span>⚙</span><b>Configuración</b></button>
      <button class="drawer-item" type="button" data-shell-view="perfil"><span>●</span><b>Perfil</b></button>
    </div>`;
}

function notificationsHtml() {
  const rows = activeToday();
  return `
    <div class="drawer-head">
      <div><small>HOY</small><h2>Pedidos activos</h2></div>
      <button class="drawer-close" type="button" data-drawer-close>×</button>
    </div>
    <div class="notice-count">${rows.length} ${rows.length === 1 ? 'pedido activo' : 'pedidos activos'}</div>
    <div class="notice-list">
      ${rows.length ? rows.map(order => `
        <button class="notice-card" type="button" data-shell-module="pedidos">
          <span><b>${escapeHtml(order.customer || 'Cliente')}</b><small>${escapeHtml(order.id)} · ${escapeHtml(order.time || '--:--')}</small></span>
          <strong>${order.status === 'pending' ? 'Pendiente' : order.status === 'preparing' ? 'Preparando' : order.status === 'ready' ? 'Listo' : 'En entrega'}</strong>
        </button>`).join('') : '<div class="shell-empty">No hay pedidos activos de hoy.</div>'}
    </div>`;
}

function openDrawer(mode = 'menu') {
  ensureShell();
  $('#adminDrawerPanel').innerHTML = mode === 'notifications' ? notificationsHtml() : menuHtml();
  drawer.hidden = false;
  document.body.classList.add('drawer-open');
}

function hideMainViews() {
  $$('.view').forEach(view => view.classList.remove('active'));
}

function setBottomNav(id) {
  $$('.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.nav === id));
}

function openShellView(id, options = {}) {
  ensureShell();
  closeDrawer();
  hideMainViews();
  shellSection.classList.add('active');
  $('#bottomNav')?.classList.remove('hidden');
  $('#hero')?.classList.remove('compact');
  setBottomNav(id);
  if (!options.keepHash) history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
  if (id === 'reportes') renderReports();
  if (id === 'configuracion') renderConfig();
  if (id === 'perfil') renderProfile();
  window.scrollTo({ top:0, behavior:'auto' });
}

function goHome() {
  closeDrawer();
  location.href = `${location.pathname}${location.search}`;
}

function openModule(id) {
  closeDrawer();
  shellSection?.classList.remove('active');
  const card = document.querySelector(`.module-card[data-module="${id}"]`);
  if (card) {
    card.click();
    return;
  }
  showToast('Módulo no disponible');
}

function dayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateISO(date);
}

function reportTotals(dateKey) {
  const orders = OrdersStore.list().filter(order => String(order.date || '') === dateKey);
  const delivered = orders.filter(order => order.status === 'delivered');
  const sales = delivered.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const purchases = PurchaseStore.list().filter(row => row.date === dateKey).reduce((sum, row) => sum + Number(row.total || 0), 0);
  const manual = ManualExpenseStore.list().filter(row => row.date === dateKey).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return {
    orders:orders.length,
    delivered:delivered.length,
    sales,
    purchases,
    manual,
    expenses:purchases + manual,
    result:sales - purchases - manual
  };
}

function shortDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('es-MX', { weekday:'short', day:'2-digit', month:'short' }).format(date).replace('.', '');
}

function reportDateKeys(days) {
  return Array.from({ length:days }, (_, index) => dayKey(-index));
}

function periodTotals(days) {
  return reportDateKeys(days).reduce((acc, dateKey) => {
    const row = reportTotals(dateKey);
    acc.orders += row.orders;
    acc.delivered += row.delivered;
    acc.sales += row.sales;
    acc.expenses += row.expenses;
    acc.result += row.result;
    return acc;
  }, { orders:0, delivered:0, sales:0, expenses:0, result:0 });
}

function topProducts(days) {
  const dates = new Set(reportDateKeys(days));
  const map = new Map();

  OrdersStore.list()
    .filter(order => order.status === 'delivered' && dates.has(String(order.date || '')))
    .forEach(order => {
      (Array.isArray(order.items) ? order.items : []).forEach(item => {
        const name = String(item.name || 'Producto').trim() || 'Producto';
        const key = normalize(name);
        if (!map.has(key)) map.set(key, { name, qty:0, revenue:0 });
        const row = map.get(key);
        row.qty += Number(item.qty || 0);
        if (item.lineTotal !== null && item.lineTotal !== undefined) row.revenue += Number(item.lineTotal || 0);
        else if (item.price !== null && item.price !== undefined) row.revenue += Number(item.qty || 0) * Number(item.price || 0);
      });
    });

  return [...map.values()].sort((a,b) => b.revenue - a.revenue || b.qty - a.qty).slice(0,5);
}

function renderReports() {
  const t = reportTotals(today());
  const period = periodTotals(reportDays);
  const avgTicket = period.delivered > 0 ? period.sales / period.delivered : 0;
  const unpaid = OrdersStore.list()
    .filter(order => order.status === 'delivered' && order.paymentStatus !== 'paid')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const products = topProducts(reportDays);
  const daysToShow = reportDateKeys(Math.min(reportDays, 10));

  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>REPORTES</small><h2>Resumen del negocio</h2></div></div>
    <div class="shell-card-head">
      <p class="shell-subtitle">Ventas entregadas, gastos registrados y resultado del panel.</p>
      <div class="report-period">
        <button class="${reportDays === 7 ? 'active' : ''}" type="button" data-report-days="7">7 días</button>
        <button class="${reportDays === 30 ? 'active' : ''}" type="button" data-report-days="30">30 días</button>
      </div>
    </div>

    <div class="shell-kpis">
      <article class="shell-kpi green"><small>Ventas · ${reportDays} días</small><strong>${money.format(period.sales)}</strong></article>
      <article class="shell-kpi red"><small>Gastos · ${reportDays} días</small><strong>${money.format(period.expenses)}</strong></article>
      <article class="shell-kpi yellow"><small>Resultado</small><strong>${money.format(period.result)}</strong></article>
      <article class="shell-kpi dark"><small>Ticket promedio</small><strong>${money.format(avgTicket)}</strong></article>
    </div>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>HOY</small><h3>Vista rápida</h3></div></div>
      <div class="report-highlight">
        <div class="report-mini"><small>Ventas hoy</small><strong>${money.format(t.sales)}</strong><span>${t.delivered} entregados</span></div>
        <div class="report-mini"><small>Por cobrar</small><strong>${money.format(unpaid)}</strong><span>Pedidos entregados pendientes de pago</span></div>
      </div>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>${reportDays === 7 ? 'ÚLTIMOS 7 DÍAS' : 'ÚLTIMOS 10 DÍAS'}</small><h3>Ventas y gastos por día</h3></div></div>
      <div class="report-table">
        <div class="report-row report-head"><span>Día</span><span>Pedidos</span><span>Ventas</span><span>Gastos</span></div>
        ${daysToShow.map(dateKey => {
          const row = reportTotals(dateKey);
          return `<div class="report-row"><b>${shortDate(dateKey)}</b><span>${row.orders}</span><span>${money.format(row.sales)}</span><span>${money.format(row.expenses)}</span></div>`;
        }).join('')}
      </div>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>PRODUCTOS</small><h3>Lo más vendido</h3></div></div>
      ${products.length ? `<div class="detail-list">${products.map(row => `
        <div><span>${escapeHtml(row.name)} · ${formatQty(row.qty)}</span><b>${money.format(row.revenue)}</b></div>`).join('')}</div>` : '<div class="shell-empty">Todavía no hay ventas entregadas suficientes para mostrar productos.</div>'}
    </section>`;
}

function menuRowsHtml() {
  const rows = MenuStore.list();
  if (!rows.length) return '<div class="shell-empty">Todavía no hay productos configurados.</div>';

  return rows.map((item, index) => `
    <div class="menu-config-row">
      <div>
        <strong>${escapeHtml(item.name || 'Producto')}</strong>
        <div class="menu-meta">
          <span class="menu-chip">${escapeHtml(item.category || 'General')}</span>
          <span class="menu-chip">${escapeHtml(item.unit || 'unidad')}</span>
          <span class="menu-chip">${item.price === null || item.price === undefined || item.price === '' ? 'Sin precio fijo' : money.format(Number(item.price || 0))}</span>
        </div>
      </div>
      <div class="row-actions"><button type="button" data-menu-edit="${index}">Editar</button><button class="danger" type="button" data-menu-delete="${index}">Eliminar</button></div>
    </div>`).join('');
}

function renderConfig(editIndex = null) {
  const cfg = settings();
  const items = MenuStore.list();
  const recipes = RecipeStore.list();
  const inventory = InventoryStore.list();
  const editing = editIndex === null ? null : items[Number(editIndex)];

  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>SISTEMA</small><h2>Configuración</h2></div></div>
    <p class="shell-subtitle">Datos del negocio, catálogo de productos y estado del panel.</p>

    <section class="shell-card">
      <div class="shell-card-head">
        <div><small>CONEXIÓN</small><h3>Estado del panel</h3></div>
        <span class="connection-pill ${connectionState === 'connected' ? 'ok' : connectionState === 'error' ? 'bad' : ''}">${connectionState === 'connected' ? 'Firebase conectado' : connectionState === 'error' ? 'Sin conexión' : 'Conectando...'}</span>
      </div>
      ${connectionMessage ? `<div class="shell-warning">${escapeHtml(connectionMessage)}</div>` : ''}
      <div class="settings-summary">
        <div><small>Productos</small><strong>${items.length}</strong></div>
        <div><small>Recetas</small><strong>${recipes.length}</strong></div>
        <div><small>Inventario</small><strong>${inventory.length}</strong></div>
      </div>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>NEGOCIO</small><h3>Datos del negocio</h3></div></div>
      <form id="businessSettingsForm" class="shell-form">
        <label>Nombre del negocio<input id="cfgBusinessName" value="${escapeAttr(cfg.businessName)}" required></label>
        <label>Tipo de negocio<input id="cfgBusinessType" value="${escapeAttr(cfg.businessType)}" placeholder="Restaurante, food truck, cafetería..."></label>
        <label>Teléfono<input id="cfgPhone" value="${escapeAttr(cfg.phone)}" inputmode="tel" placeholder="Opcional"></label>
        <label>WhatsApp<input id="cfgWhatsapp" value="${escapeAttr(cfg.whatsapp)}" inputmode="tel" placeholder="Opcional"></label>
        <label class="full">Dirección<input id="cfgAddress" value="${escapeAttr(cfg.address)}" placeholder="Calle y número"></label>
        <label>Ciudad<input id="cfgCity" value="${escapeAttr(cfg.city)}"></label>
        <label>Estado / región<input id="cfgRegion" value="${escapeAttr(cfg.region)}"></label>
        <label>ZIP / CP<input id="cfgZip" value="${escapeAttr(cfg.zip)}" inputmode="numeric"></label>
        <label class="full">Notas internas<textarea id="cfgNotes" placeholder="Información interna del negocio">${escapeHtml(cfg.notes)}</textarea></label>
        <button class="shell-primary" type="submit">Guardar configuración</button>
      </form>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>CATÁLOGO</small><h3>Productos / platillos</h3></div></div>
      <p class="shell-subtitle">Estos productos aparecen en el selector de Nuevo Pedido. Elegir un producto no llena cantidad, unidad ni precio.</p>
      <form id="menuItemForm" class="shell-form" data-edit-index="${editIndex === null ? '' : editIndex}">
        <label>Producto<input id="cfgProductName" value="${escapeAttr(editing?.name || '')}" placeholder="Nombre del producto" required></label>
        <label>Categoría<input id="cfgProductCategory" value="${escapeAttr(editing?.category || '')}" placeholder="Ceviches, bebidas, tacos..."></label>
        <label>Unidad base<input id="cfgProductUnit" value="${escapeAttr(editing?.unit || '')}" placeholder="lb, pieza, orden..." required><span class="field-note">Sirve para recetas y preparación; en Nuevo Pedido sigue vacío.</span></label>
        <label>Precio de referencia<input id="cfgProductPrice" type="number" min="0" step="0.01" value="${editing?.price ?? ''}" placeholder="Opcional"><span class="field-note">No se llena automáticamente en Nuevo Pedido.</span></label>
        <div class="config-form-actions">${editing ? '<button class="shell-secondary" type="button" data-menu-cancel>Cancelar</button>' : ''}<button class="shell-primary" type="submit">${editing ? 'Guardar cambio' : 'Agregar producto'}</button></div>
      </form>
      <div class="menu-config-list">${menuRowsHtml()}</div>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>DATOS</small><h3>Dónde se guarda cada cosa</h3></div></div>
      <div class="detail-list compact">
        <div><span>Pedidos de clientes</span><b>Firebase</b></div>
        <div><span>Configuración y perfil</span><b>Este dispositivo</b></div>
        <div><span>Menú, recetas, inventario y compras</span><b>Panel Operativo</b></div>
      </div>
    </section>`;
}

function renderProfile() {
  const p = profile();
  const cfg = settings();

  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>CUENTA</small><h2>Perfil</h2></div></div>
    <p class="shell-subtitle">Datos de la persona que usa este panel en este dispositivo.</p>

    <section class="profile-card">
      <div class="profile-avatar">${initials(p.name)}</div>
      <div><small>USUARIO DEL PANEL</small><h3>${escapeHtml(p.name || 'Administrador')}</h3><p>${escapeHtml(p.role || 'Administrador')}</p></div>
    </section>

    <section class="shell-card">
      <div class="shell-card-head"><div><small>DATOS</small><h3>Perfil del usuario</h3></div></div>
      <form id="profileForm" class="shell-form">
        <label>Nombre<input id="profileName" value="${escapeAttr(p.name)}" required></label>
        <label>Rol<select id="profileRole">
          ${['Propietario','Administrador','Caja','Cocina','Reparto','Otro'].map(role => `<option value="${role}" ${String(p.role) === role ? 'selected' : ''}>${role}</option>`).join('')}
        </select></label>
        <label>Teléfono<input id="profilePhone" value="${escapeAttr(p.phone)}" inputmode="tel" placeholder="Opcional"></label>
        <label>Correo<input id="profileEmail" value="${escapeAttr(p.email)}" inputmode="email" placeholder="Opcional"></label>
        <button class="shell-primary" type="submit">Guardar perfil</button>
      </form>
    </section>

    <section class="shell-card">
      <div class="detail-list compact">
        <div><span>Negocio</span><b>${escapeHtml(cfg.businessName || BUSINESS.name)}</b></div>
        <div><span>Rol</span><b>${escapeHtml(p.role || 'Administrador')}</b></div>
        <div><span>Datos guardados</span><b>En este dispositivo</b></div>
      </div>
    </section>

    <div class="profile-note"><b>Nota:</b> este perfil identifica al usuario dentro del panel, pero todavía no es un sistema de acceso con contraseña ni permisos por rol.</div>`;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
}

function initials(name) {
  const words = String(name || 'Administrador').trim().split(/\s+/).filter(Boolean).slice(0,2);
  return words.map(word => word[0]?.toUpperCase() || '').join('') || 'A';
}

function formatQty(value) {
  const number = Number(value || 0);
  const rounded = Math.round(number * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function saveBusinessSettings(form) {
  const next = {
    ...settings(),
    businessName:$('#cfgBusinessName', form).value.trim(),
    businessType:$('#cfgBusinessType', form).value.trim(),
    phone:$('#cfgPhone', form).value.trim(),
    whatsapp:$('#cfgWhatsapp', form).value.trim(),
    address:$('#cfgAddress', form).value.trim(),
    city:$('#cfgCity', form).value.trim(),
    region:$('#cfgRegion', form).value.trim(),
    zip:$('#cfgZip', form).value.trim(),
    notes:$('#cfgNotes', form).value.trim()
  };

  writeJson(SETTINGS_KEY, next);
  window.dispatchEvent(new CustomEvent('panel:settings-changed', { detail:{ settings:next } }));
  showToast('Configuración guardada');
  renderConfig();
}

function saveMenuItem(form) {
  const name = $('#cfgProductName', form).value.trim();
  const category = $('#cfgProductCategory', form).value.trim() || 'General';
  const unit = $('#cfgProductUnit', form).value.trim();
  const rawPrice = $('#cfgProductPrice', form).value.trim();
  const price = rawPrice === '' ? null : Number(rawPrice);

  if (!name || !unit || (price !== null && (!Number.isFinite(price) || price < 0))) return;

  const items = MenuStore.list();
  const editIndex = form.dataset.editIndex === '' ? null : Number(form.dataset.editIndex);
  const duplicate = items.findIndex((item,index) => index !== editIndex && normalize(item.name) === normalize(name));
  if (duplicate >= 0) {
    showToast('Ese producto ya existe');
    return;
  }

  const payload = { name, category, unit, price };
  if (editIndex === null || !items[editIndex]) items.push(payload);
  else items[editIndex] = { ...items[editIndex], ...payload };

  MenuStore.save(items);
  window.dispatchEvent(new CustomEvent('panel:menu-changed', { detail:{ items } }));
  showToast(editIndex === null ? 'Producto agregado' : 'Producto actualizado');
  renderConfig();
}

function saveProfile(form) {
  const next = {
    name:$('#profileName', form).value.trim(),
    role:$('#profileRole', form).value,
    phone:$('#profilePhone', form).value.trim(),
    email:$('#profileEmail', form).value.trim()
  };

  writeJson(PROFILE_KEY, next);
  window.dispatchEvent(new CustomEvent('panel:profile-changed', { detail:{ profile:next } }));
  showToast('Perfil guardado');
  renderProfile();
}

function bindGlobalInteractions() {
  document.addEventListener('click', event => {
    if (event.target.closest('#menuButton')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDrawer('menu');
      return;
    }

    if (event.target.closest('#bellButton')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDrawer('notifications');
      return;
    }

    const nav = event.target.closest('.bottom-nav button[data-nav]');
    if (nav) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = nav.dataset.nav;
      if (id === 'inicio') goHome();
      else if (['reportes','configuracion','perfil'].includes(id)) openShellView(id);
      return;
    }

    if (event.target.closest('[data-drawer-close]')) {
      event.preventDefault();
      closeDrawer();
      return;
    }

    const module = event.target.closest('[data-shell-module]');
    if (module) {
      event.preventDefault();
      openModule(module.dataset.shellModule);
      return;
    }

    const shellNav = event.target.closest('[data-shell-view]');
    if (shellNav) {
      event.preventDefault();
      openShellView(shellNav.dataset.shellView);
      return;
    }

    if (event.target.closest('[data-shell-home]')) {
      event.preventDefault();
      goHome();
      return;
    }

    const period = event.target.closest('[data-report-days]');
    if (period) {
      event.preventDefault();
      reportDays = Number(period.dataset.reportDays) === 30 ? 30 : 7;
      renderReports();
      return;
    }

    const edit = event.target.closest('[data-menu-edit]');
    if (edit) {
      event.preventDefault();
      renderConfig(Number(edit.dataset.menuEdit));
      return;
    }

    const remove = event.target.closest('[data-menu-delete]');
    if (remove) {
      event.preventDefault();
      const items = MenuStore.list();
      items.splice(Number(remove.dataset.menuDelete), 1);
      MenuStore.save(items);
      window.dispatchEvent(new CustomEvent('panel:menu-changed', { detail:{ items } }));
      showToast('Producto eliminado');
      renderConfig();
      return;
    }

    if (event.target.closest('[data-menu-cancel]')) {
      event.preventDefault();
      renderConfig();
    }
  }, true);

  document.addEventListener('submit', event => {
    if (event.target.id === 'businessSettingsForm') {
      event.preventDefault();
      saveBusinessSettings(event.target);
      return;
    }

    if (event.target.id === 'menuItemForm') {
      event.preventDefault();
      saveMenuItem(event.target);
      return;
    }

    if (event.target.id === 'profileForm') {
      event.preventDefault();
      saveProfile(event.target);
    }
  }, true);

  window.addEventListener('panel:orders-changed', () => {
    setTimeout(fixOrderBadges, 0);
    if (location.hash === '#reportes') renderReports();
  });

  window.addEventListener('panel:firebase-state', event => {
    connectionState = event.detail?.state || 'error';
    connectionMessage = event.detail?.message || '';
    if (location.hash === '#configuracion') renderConfig();
  });
}

function boot() {
  ensureShell();
  bindGlobalInteractions();
  setTimeout(fixOrderBadges, 0);
  setTimeout(fixOrderBadges, 600);
  const hash = location.hash.replace('#','');
  if (['reportes','configuracion','perfil'].includes(hash)) openShellView(hash, { keepHash:true });
}

boot();

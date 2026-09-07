import { BUSINESS, MODULES } from './config.js';
import { OrdersStore, MenuStore, InventoryStore } from './data.js';
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

function ensureStyles() {
  if (document.querySelector('link[data-admin-shell]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './admin-shell.css?v=20260907-1840';
  link.dataset.adminShell = '1';
  document.head.appendChild(link);
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
  return readJson(PROFILE_KEY, { name:'Administrador', role:'Administrador', phone:'', email:'' });
}

function settings() {
  return readJson(SETTINGS_KEY, { businessName:BUSINESS.name || 'El Cubano', phone:'', whatsapp:'', notes:'' });
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
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function closeDrawer() {
  if (!drawer) return;
  drawer.hidden = true;
  document.body.classList.remove('drawer-open');
}

function menuHtml() {
  const p = profile();
  const modules = MODULES.map(module => `
    <button class="drawer-item" type="button" data-shell-module="${module.id}">
      <span>${module.icon}</span><b>${module.label}</b>
    </button>`).join('');
  return `
    <div class="drawer-head">
      <div class="drawer-brand"><img src="${BUSINESS.logo}" alt=""><div><small>PANEL OPERATIVO</small><strong>${p.name || 'Administrador'}</strong></div></div>
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
          <span><b>${order.customer || 'Cliente'}</b><small>${order.id} · ${order.time || '--:--'}</small></span>
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
  return { orders:orders.length, sales, purchases, manual, expenses:purchases + manual, result:sales - purchases - manual };
}

function shortDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat('es-MX', { weekday:'short', day:'2-digit', month:'short' }).format(date).replace('.', '');
}

function renderReports() {
  const t = reportTotals(today());
  const days = Array.from({ length:7 }, (_, index) => dayKey(-index));
  const unpaid = OrdersStore.list().filter(order => order.status === 'delivered' && order.paymentStatus !== 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0);
  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>REPORTES</small><h2>Resumen del negocio</h2></div></div>
    <div class="shell-kpis">
      <article class="shell-kpi green"><small>Ventas hoy</small><strong>${money.format(t.sales)}</strong></article>
      <article class="shell-kpi red"><small>Gastos hoy</small><strong>${money.format(t.expenses)}</strong></article>
      <article class="shell-kpi yellow"><small>Resultado</small><strong>${money.format(t.result)}</strong></article>
      <article class="shell-kpi dark"><small>Por cobrar</small><strong>${money.format(unpaid)}</strong></article>
    </div>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>ÚLTIMOS 7 DÍAS</small><h3>Ventas y gastos</h3></div></div>
      <div class="report-table">
        <div class="report-row report-head"><span>Día</span><span>Pedidos</span><span>Ventas</span><span>Gastos</span></div>
        ${days.map(dateKey => {
          const row = reportTotals(dateKey);
          return `<div class="report-row"><b>${shortDate(dateKey)}</b><span>${row.orders}</span><span>${money.format(row.sales)}</span><span>${money.format(row.expenses)}</span></div>`;
        }).join('')}
      </div>
    </section>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>HOY</small><h3>Desglose</h3></div></div>
      <div class="detail-list">
        <div><span>Pedidos registrados</span><b>${t.orders}</b></div>
        <div><span>Compras de inventario</span><b>${money.format(t.purchases)}</b></div>
        <div><span>Otros gastos</span><b>${money.format(t.manual)}</b></div>
        <div><span>Resultado del día</span><b>${money.format(t.result)}</b></div>
      </div>
    </section>`;
}

function menuRowsHtml() {
  const rows = MenuStore.list();
  if (!rows.length) return '<div class="shell-empty">Todavía no hay productos configurados para pedidos manuales.</div>';
  return rows.map((item, index) => `
    <div class="menu-config-row">
      <div><strong>${item.name || 'Producto'}</strong><small>${item.unit || 'unidad'} · ${item.price === null || item.price === undefined || item.price === '' ? 'Sin precio' : money.format(Number(item.price || 0))}</small></div>
      <div class="row-actions"><button type="button" data-menu-edit="${index}">Editar</button><button class="danger" type="button" data-menu-delete="${index}">Eliminar</button></div>
    </div>`).join('');
}

function renderConfig(editIndex = null) {
  const cfg = settings();
  const items = MenuStore.list();
  const editing = editIndex === null ? null : items[Number(editIndex)];
  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>SISTEMA</small><h2>Configuración</h2></div></div>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>CONEXIÓN</small><h3>Estado del panel</h3></div><span class="connection-pill ${connectionState === 'connected' ? 'ok' : connectionState === 'error' ? 'bad' : ''}">${connectionState === 'connected' ? 'Firebase conectado' : connectionState === 'error' ? 'Sin conexión' : 'Conectando...'}</span></div>
      ${connectionMessage ? `<div class="shell-warning">${connectionMessage}</div>` : ''}
      <div class="detail-list compact">
        <div><span>Pedidos de clientes</span><b>Firebase</b></div>
        <div><span>Inventario / recetas / compras</span><b>Panel Operativo</b></div>
      </div>
    </section>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>NEGOCIO</small><h3>Datos del panel</h3></div></div>
      <form id="businessSettingsForm" class="shell-form">
        <label>Nombre del negocio<input id="cfgBusinessName" value="${escapeAttr(cfg.businessName)}" required></label>
        <label>Teléfono<input id="cfgPhone" value="${escapeAttr(cfg.phone)}" inputmode="tel" placeholder="Opcional"></label>
        <label>WhatsApp<input id="cfgWhatsapp" value="${escapeAttr(cfg.whatsapp)}" inputmode="tel" placeholder="Opcional"></label>
        <label>Notas internas<input id="cfgNotes" value="${escapeAttr(cfg.notes)}" placeholder="Opcional"></label>
        <button class="shell-primary" type="submit">Guardar datos</button>
      </form>
    </section>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>PEDIDOS MANUALES</small><h3>Menú de venta</h3></div></div>
      <form id="menuItemForm" class="shell-form shell-form-inline" data-edit-index="${editIndex === null ? '' : editIndex}">
        <label>Producto<input id="cfgProductName" value="${escapeAttr(editing?.name || '')}" placeholder="Ej. Ceviche mixto" required></label>
        <label>Unidad<input id="cfgProductUnit" value="${escapeAttr(editing?.unit || '')}" placeholder="lb, pieza, orden..." required></label>
        <label>Precio<input id="cfgProductPrice" type="number" min="0" step="0.01" value="${editing?.price ?? ''}" placeholder="0.00" required></label>
        <div class="config-form-actions">${editing ? '<button class="shell-secondary" type="button" data-menu-cancel>Cancelar</button>' : ''}<button class="shell-primary" type="submit">${editing ? 'Guardar cambio' : 'Agregar producto'}</button></div>
      </form>
      <div class="menu-config-list">${menuRowsHtml()}</div>
    </section>`;
}

function renderProfile() {
  const p = profile();
  shellSection.innerHTML = `
    <div class="shell-topbar"><button class="shell-back" type="button" data-shell-home>‹</button><div><small>CUENTA LOCAL</small><h2>Perfil</h2></div></div>
    <section class="profile-card">
      <div class="profile-avatar">${initials(p.name)}</div>
      <div><small>USUARIO DEL PANEL</small><h3>${p.name || 'Administrador'}</h3><p>${p.role || 'Administrador'}</p></div>
    </section>
    <section class="shell-card">
      <div class="shell-card-head"><div><small>DATOS</small><h3>Perfil del administrador</h3></div></div>
      <form id="profileForm" class="shell-form">
        <label>Nombre<input id="profileName" value="${escapeAttr(p.name)}" required></label>
        <label>Rol<input id="profileRole" value="${escapeAttr(p.role)}" required></label>
        <label>Teléfono<input id="profilePhone" value="${escapeAttr(p.phone)}" inputmode="tel" placeholder="Opcional"></label>
        <label>Correo<input id="profileEmail" value="${escapeAttr(p.email)}" inputmode="email" placeholder="Opcional"></label>
        <button class="shell-primary" type="submit">Guardar perfil</button>
      </form>
    </section>
    <section class="shell-card">
      <div class="detail-list compact">
        <div><span>Negocio</span><b>${settings().businessName || BUSINESS.name}</b></div>
        <div><span>Perfil</span><b>Administrador</b></div>
        <div><span>Datos guardados</span><b>En este dispositivo</b></div>
      </div>
    </section>`;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function initials(name) {
  const words = String(name || 'Administrador').trim().split(/\s+/).filter(Boolean).slice(0,2);
  return words.map(word => word[0]?.toUpperCase() || '').join('') || 'A';
}

function saveBusinessSettings(form) {
  const next = {
    businessName:$('#cfgBusinessName', form).value.trim(),
    phone:$('#cfgPhone', form).value.trim(),
    whatsapp:$('#cfgWhatsapp', form).value.trim(),
    notes:$('#cfgNotes', form).value.trim()
  };
  writeJson(SETTINGS_KEY, next);
  showToast('Configuración guardada');
  renderConfig();
}

function saveMenuItem(form) {
  const name = $('#cfgProductName', form).value.trim();
  const unit = $('#cfgProductUnit', form).value.trim();
  const price = Number($('#cfgProductPrice', form).value);
  if (!name || !unit || !Number.isFinite(price) || price < 0) return;
  const items = MenuStore.list();
  const editIndex = form.dataset.editIndex === '' ? null : Number(form.dataset.editIndex);
  const payload = { name, unit, price };
  if (editIndex === null || !items[editIndex]) items.push(payload);
  else items[editIndex] = { ...items[editIndex], ...payload };
  MenuStore.save(items);
  showToast(editIndex === null ? 'Producto agregado' : 'Producto actualizado');
  renderConfig();
}

function saveProfile(form) {
  const next = {
    name:$('#profileName', form).value.trim(),
    role:$('#profileRole', form).value.trim(),
    phone:$('#profilePhone', form).value.trim(),
    email:$('#profileEmail', form).value.trim()
  };
  writeJson(PROFILE_KEY, next);
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
    }
    if (event.target.id === 'menuItemForm') {
      event.preventDefault();
      saveMenuItem(event.target);
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

const STORAGE_KEY = 'panel-next-orders-v3';

const localDateISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
};

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeOrders(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  return rows;
}

function dispatch(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name,{ detail }));
}

function updateLocalOrder(id, patch) {
  const rows = readOrders();
  const index = rows.findIndex(order => order.id === id);
  if (index < 0) return null;
  rows[index] = { ...rows[index], ...patch, updatedAt:Date.now() };
  writeOrders(rows);
  return rows[index];
}

function upsertManualCloud(order) {
  const rows = readOrders();
  const index = rows.findIndex(item => item.id === order.id);
  const next = {
    ...(index >= 0 ? rows[index] : {}),
    ...order,
    cloud:true,
    remoteManual:true,
    syncedAt:Date.now()
  };
  if (index >= 0) rows[index] = next;
  else rows.unshift(next);
  writeOrders(rows);
  dispatch('panel:orders-changed',{ source:'manual-cloud-sync', order:next });
  return next;
}

function setTextIfChanged(node, value) {
  if (!node) return;
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function repairHomeCounters() {
  const today = localDateISO();
  const rows = readOrders();
  const todays = rows.filter(order => String(order.date || '') === today);
  const active = todays.filter(order => !['delivered','cancelled'].includes(order.status));
  const preparing = todays.filter(order => ['pending','preparing'].includes(order.status));
  const sales = todays.filter(order => order.status === 'delivered').reduce((sum,order)=>sum+Number(order.total || 0),0);

  const orderCard = document.querySelector('.module-card[data-module="pedidos"]');
  if (orderCard) {
    let badge = orderCard.querySelector('.module-badge');
    if (active.length) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'module-badge';
        orderCard.prepend(badge);
      }
      setTextIfChanged(badge, active.length);
      badge.hidden = false;
    } else if (badge) badge.remove();
  }

  const bell = document.querySelector('.badge-notify');
  if (bell) {
    setTextIfChanged(bell, active.length);
    bell.hidden = active.length === 0;
  }

  document.querySelectorAll('.summary-card').forEach(card=>{
    const label = card.querySelector('b')?.textContent?.trim();
    const strong = card.querySelector('strong');
    if (!strong) return;
    if (label === 'Pedidos') setTextIfChanged(strong, todays.length);
    if (label === 'Por preparar') setTextIfChanged(strong, `${preparing.length} ${preparing.length === 1 ? 'pedido' : 'pedidos'}`);
    if (label === 'Ventas') setTextIfChanged(strong, new Intl.NumberFormat('es-US',{style:'currency',currency:'USD'}).format(sales));
  });
}

function enhanceOrderCards() {
  document.querySelectorAll('.order-card[data-order-id]').forEach(card=>{
    if (card.dataset.quickLinks === '1') return;
    const order = readOrders().find(row => row.id === card.dataset.orderId);
    if (!order) return;
    const actions = card.querySelector('.order-card-actions');
    if (!actions) return;

    const phone = String(order.phone || '').replace(/\D/g,'');
    if (phone) {
      const wa = document.createElement('a');
      wa.className = 'order-action';
      wa.href = `https://wa.me/${phone.length === 10 ? `1${phone}` : phone}`;
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'WhatsApp';
      actions.prepend(wa);
    }

    const target = [order.address,order.zip].filter(Boolean).join(' ');
    if (target) {
      const map = document.createElement('a');
      map.className = 'order-action';
      map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
      map.target = '_blank';
      map.rel = 'noopener';
      map.textContent = 'Mapa';
      actions.prepend(map);
    }
    card.dataset.quickLinks = '1';
  });
}

function refreshUi() {
  repairHomeCounters();
  enhanceOrderCards();
}

setTimeout(refreshUi,0);
setTimeout(refreshUi,700);
window.addEventListener('panel:orders-changed',()=>setTimeout(refreshUi,0));

const ordersList = document.querySelector('#ordersList');
if (ordersList) {
  let enhanceScheduled = false;
  new MutationObserver(() => {
    if (enhanceScheduled) return;
    enhanceScheduled = true;
    requestAnimationFrame(() => {
      enhanceScheduled = false;
      enhanceOrderCards();
    });
  }).observe(ordersList,{childList:true});
}

(async function bootManualOrderCloud() {
  try {
    const [{ initializeApp }, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
    ]);
    const { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } = firestore;
    const firebaseConfig = {
      apiKey:'AIzaSyBbOIXTr2Tvz1FvoTk5GZgP2jx24jpjlL4',
      authDomain:'ceviches-y-cocteles-el-chava.firebaseapp.com',
      projectId:'ceviches-y-cocteles-el-chava',
      storageBucket:'ceviches-y-cocteles-el-chava.firebasestorage.app',
      messagingSenderId:'227568387475',
      appId:'1:227568387475:web:6ccd3e67e62d1bf4b0d466'
    };
    const app = initializeApp(firebaseConfig,'panel-whatsapp-ops');
    const db = getFirestore(app);

    const cloudItems = items => (Array.isArray(items) ? items : []).map(item=>({
      productId:item.productId || '',
      name:item.name || 'Producto',
      detail:item.detail || '',
      qty:Number(item.qty || 0),
      unit:item.unit || 'orden',
      unitPrice:item.price === null || item.price === undefined ? null : Number(item.price),
      lineTotal:Number(item.lineTotal ?? (Number(item.qty || 0) * Number(item.price || 0))),
      recipeQty:Number(item.recipeQty ?? item.qty ?? 0),
      recipeUnit:item.recipeUnit || item.unit || 'orden'
    }));

    const cloudPayload = order => ({
      id:order.id,
      source:'app-clientes',
      panelSource:'panel-operativo',
      orderSource:order.source || 'WhatsApp',
      status:order.status || 'pending',
      customer:order.customer || '',
      phone:order.phone || '',
      address:order.address || '',
      zip:order.zip || '',
      deliveryDate:order.date || '',
      time:order.time || '',
      payment:order.payment || 'Al recibir',
      paymentStatus:order.paymentStatus || 'pending',
      notes:order.notes || 'Sin notas',
      items:cloudItems(order.items),
      total:Number(order.total || 0),
      createdAtClient:Number(order.createdAt || Date.now()),
      panelUpdatedAt:serverTimestamp()
    });

    window.addEventListener('panel:orders-changed',async event=>{
      if (event.detail?.source !== 'local-create') return;
      const order = event.detail?.order;
      if (!order?.id) return;
      updateLocalOrder(order.id,{firestoreId:order.id,remoteManual:true,cloud:true});
      try {
        await setDoc(doc(db,'pedidos',order.id),{...cloudPayload(order),createdAt:serverTimestamp()},{merge:true});
        dispatch('panel:manual-order-saved',{orderId:order.id});
      } catch (error) {
        updateLocalOrder(order.id,{firestoreId:null,remoteManual:false,cloud:false});
        console.error('No se pudo guardar el pedido manual en Firebase:',error);
      }
    });

    window.addEventListener('panel:order-updated',async event=>{
      const order = event.detail?.order;
      if (!order?.remoteManual || !order.firestoreId) return;
      try {
        await updateDoc(doc(db,'pedidos',order.firestoreId),cloudPayload(order));
      } catch (error) {
        console.error('No se pudo actualizar el pedido manual en Firebase:',error);
      }
    });

    onSnapshot(collection(db,'pedidos'),snapshot=>{
      snapshot.forEach(row=>{
        const raw = row.data() || {};
        if (raw.panelSource !== 'panel-operativo') return;
        upsertManualCloud({
          id:row.id,
          firestoreId:row.id,
          source:raw.orderSource || 'WhatsApp',
          customer:raw.customer || 'Cliente',
          phone:raw.phone || '',
          address:raw.address || '',
          zip:raw.zip || '',
          date:raw.deliveryDate || '',
          time:raw.time || '',
          payment:raw.payment || 'Al recibir',
          paymentStatus:raw.paymentStatus === 'paid' ? 'paid' : 'pending',
          notes:raw.notes && raw.notes !== 'Sin notas' ? raw.notes : '',
          status:raw.status || 'pending',
          items:Array.isArray(raw.items) ? raw.items.map(item=>({
            ...item,
            price:item.unitPrice ?? null
          })) : [],
          total:Number(raw.total || 0),
          createdAt:Number(raw.createdAtClient || Date.now())
        });
      });
      refreshUi();
    });
  } catch (error) {
    console.error('Cloud de pedidos manuales no disponible:',error);
  }
})();

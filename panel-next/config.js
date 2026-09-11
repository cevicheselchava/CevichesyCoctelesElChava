if (typeof window !== 'undefined') {
  setTimeout(() => import('./whatsapp-ops.js?v=20260908-0730').catch(error => console.error('Operación WhatsApp:', error)), 0);
  setTimeout(() => import('./order-product-picker.js?v=20260908-1703').catch(error => console.error('Selector de productos:', error)), 0);
  setTimeout(() => import('./direct-sales.js?v=20260911-0618').catch(error => console.error('Venta directa:', error)), 0);
}

export const BUSINESS = {
  id: 'el-cubano',
  name: 'El Cubano',
  logo: '/logo.png?v=20260907-1708',
  watermark: '/logo.png?v=20260907-1708',
  panelTitle: 'PANEL OPERATIVO',
  sideSlogan: 'Good Food\nGood Vibes',
  footerSlogan: 'Ceviches, Cócteles\ny Buena Vibra',
  footerTag: 'ONE\nLOVE',
  currency: 'USD',
  locale: 'es-US',
  serviceModes: ['delivery'],
  theme: {
    green: '#078844',
    yellow: '#ffd52f',
    red: '#ef2e37',
    blue: '#2d9ee8',
    orange: '#f47b19',
    purple: '#6534a6'
  }
};

export const MODULES = [
  { id: 'pedidos', label: 'Pedidos', subtitle: 'Gestiona y consulta los pedidos', icon: '📋', color: 'green' },
  { id: 'venta', label: 'Venta', subtitle: 'Registra una venta del día', icon: '💵', color: 'orange' },
  { id: 'compras', label: 'Compras', subtitle: 'Genera y da seguimiento a tus compras', icon: '🛒', color: 'blue' },
  { id: 'preparacion', label: 'Preparación', subtitle: 'Controla la cocina y tiempos', icon: '👨‍🍳', color: 'yellow' },
  { id: 'entregas', label: 'Entregas', subtitle: 'Controla repartos y envíos', icon: '🛵', color: 'orange' },
  { id: 'inventario', label: 'Inventario', subtitle: 'Revisa existencias en tiempo real', icon: '📦', color: 'red' },
  { id: 'dinero', label: 'Dinero', subtitle: 'Ventas, gastos y utilidades', icon: '🪙', color: 'green' },
  { id: 'recetas', label: 'Recetas', subtitle: 'Administra tus recetas y porciones', icon: '📖', color: 'purple', wide: true }
];

export const MENU_DEFAULT = [];

export const UNITS = ['pieza', 'orden', 'lb', '1/2 lb', 'oz', 'vaso', 'combo', 'paquete', 'otro'];

export const ORDER_STATUSES = [
  { id: 'pending', label: 'Pendiente' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'ready', label: 'Listo' },
  { id: 'delivery', label: 'En entrega' },
  { id: 'delivered', label: 'Entregado' },
  { id: 'cancelled', label: 'Cancelado' }
];

export const PAYMENT_METHODS = ['Al recibir', 'Efectivo', 'Cash App', 'Zelle', 'Tarjeta', 'Otro'];
export const ORDER_SOURCES = ['Campaña Facebook', 'WhatsApp', 'Facebook', 'Teléfono', 'App', 'Otro'];

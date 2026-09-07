export const BUSINESS = {
  id: 'el-cubano',
  name: 'El Cubano',
  logo: '/logo.png',
  watermark: '/logo.png',
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
  { id: 'preparacion', label: 'Preparación', subtitle: 'Controla la cocina y tiempos', icon: '👨‍🍳', color: 'yellow' },
  { id: 'inventario', label: 'Inventario', subtitle: 'Revisa existencias en tiempo real', icon: '📦', color: 'red' },
  { id: 'compras', label: 'Compras', subtitle: 'Genera y da seguimiento a tus compras', icon: '🛒', color: 'blue' },
  { id: 'entregas', label: 'Entregas', subtitle: 'Controla repartos y envíos', icon: '🛵', color: 'orange' },
  { id: 'dinero', label: 'Dinero', subtitle: 'Ventas, gastos y utilidades', icon: '🪙', color: 'green' },
  { id: 'recetas', label: 'Recetas', subtitle: 'Administra tus recetas y porciones', icon: '📖', color: 'purple', wide: true }
];

// El menú NO se fija en el código. Cada negocio configurará sus propios productos,
// unidades y precios. Este arreglo queda vacío hasta construir Configuración.
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
export const ORDER_SOURCES = ['WhatsApp', 'Facebook', 'Teléfono', 'App', 'Otro'];

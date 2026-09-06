export const BUSINESS = {
  id: 'el-cubano',
  name: 'El Cubano',
  logo: '/logo.png',
  watermark: '/logo.png',
  panelTitle: 'PANEL OPERATIVO',
  sideSlogan: 'Good Food\nGood Vibes',
  footerSlogan: 'Ceviches, Cócteles\ny Buena Vibra',
  footerTag: 'ONE\nLOVE',
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
  { id: 'pedidos', label: 'Pedidos', subtitle: 'Gestiona y consulta los pedidos', icon: '📋', color: 'green', badge: 6 },
  { id: 'preparacion', label: 'Preparación', subtitle: 'Controla la cocina y tiempos', icon: '👨‍🍳', color: 'yellow' },
  { id: 'inventario', label: 'Inventario', subtitle: 'Revisa existencias en tiempo real', icon: '📦', color: 'red' },
  { id: 'compras', label: 'Compras', subtitle: 'Genera y da seguimiento a tus compras', icon: '🛒', color: 'blue' },
  { id: 'entregas', label: 'Entregas', subtitle: 'Controla repartos y envíos', icon: '🛵', color: 'orange' },
  { id: 'dinero', label: 'Dinero', subtitle: 'Ventas, gastos y utilidades', icon: '🪙', color: 'green' },
  { id: 'recetas', label: 'Recetas', subtitle: 'Administra tus recetas y porciones', icon: '📖', color: 'purple', wide: true }
];

export const HOME_SUMMARY = [
  { label: 'Pedidos', value: '6', note: 'Total del día', icon: '📋', tone: 'mint' },
  { label: 'Por preparar', value: 'Mixto 6 lb', note: 'En cocina', icon: '👨‍🍳', tone: 'cream' },
  { label: 'Por comprar', value: '8', note: 'Productos faltantes', icon: '📦', tone: 'pink' },
  { label: 'Ventas', value: '$102.00', note: 'Total del día', icon: '$', tone: 'mint' }
];

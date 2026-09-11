(()=>{
  const INVENTORY_KEY = 'panel-next-inventory-v2';
  const PURCHASES_KEY = 'panel-next-purchases-v1';
  const CLEANUP_KEY = 'panel-next-inventory-demo-clean-v1';
  if (localStorage.getItem(CLEANUP_KEY) === 'done') return;

  let purchases = [];
  let inventory = [];
  try { purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]'); } catch (_) {}
  try { inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]'); } catch (_) {}

  // Solo limpia el inventario demo heredado cuando todavía no hay compras reales registradas.
  if (!Array.isArray(purchases) || purchases.length === 0) {
    const demoIds = new Set(['I-1001','I-1002','I-1003','I-1004']);
    if (Array.isArray(inventory) && inventory.length) {
      inventory = inventory.map(item => demoIds.has(item?.id)
        ? { ...item, qty:0, minimum:0, purchasePrice:0, cost:0, updatedAt:Date.now() }
        : item);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
  }

  localStorage.setItem(CLEANUP_KEY,'done');
})();

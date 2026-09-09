// Este módulo se conserva solo para limpiar instalaciones antiguas que todavía lo tengan en caché.
// La cantidad a preparar ya no se captura ni se guarda dentro de Compras.
const clean = () => {
  document.getElementById('purchasePlanSection')?.remove();
  try { localStorage.removeItem('panel-preparation-plan-v1'); } catch (_) {}
};
clean();
new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});

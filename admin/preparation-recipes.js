(()=>{
  if(window.__EL_CUBANO_PREP_RECIPES_HOME__)return;
  window.__EL_CUBANO_PREP_RECIPES_HOME__=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const recipePanel=document.getElementById('recipes');
  const preparePanel=document.getElementById('prepare');
  const recipeCard=recipePanel?.querySelector('.card');
  const prepareCard=preparePanel?.querySelector('.card');
  const recipeNav=document.querySelector('#mainNav [data-tab="recipes"]');
  const prepareNav=document.querySelector('#mainNav [data-tab="prepare"]');
  if(!recipePanel||!preparePanel||!recipeCard||!prepareCard||!recipeNav)return;

  const style=document.createElement('style');
  style.textContent=`
    #mainNav [data-tab="recipes"] .nav-label{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12;text-align:center}
    .prep-recipes-menu{display:grid;gap:10px}
    .prep-recipes-choice{width:100%;border:1px solid #ded7c8;border-radius:17px;background:#fff;padding:15px;text-align:left;display:grid;grid-template-columns:48px 1fr;gap:11px;align-items:center;box-shadow:0 5px 14px rgba(22,50,72,.07)}
    .prep-recipes-choice .ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#eef8ef;font-size:27px}
    .prep-recipes-choice b{display:block;color:#174f2b;font-size:18px}
    .prep-recipes-choice small{display:block;color:#687386;margin-top:4px;font-weight:800;line-height:1.35}
    .prep-recipes-back{width:100%;margin-bottom:10px;border:1px solid #cad9eb;border-radius:12px;padding:11px;background:#eef3f8;color:#123458;font-weight:1000}
    .prep-order-list{display:grid;gap:9px}
    .prep-order-card{border:1px solid #ded7c8;border-left:5px solid #267642;border-radius:14px;padding:12px;background:#fff}
    .prep-order-card strong{color:#174f2b}
    .prep-order-card small{display:block;color:#687386;margin-top:4px;line-height:1.45}
    .prep-order-card button{width:100%;margin-top:10px;border:0;border-radius:11px;padding:12px;font-weight:1000;background:linear-gradient(135deg,#267642,#319552);color:#fff;box-shadow:inset 0 -4px 0 #f2b632}
  `;
  document.head.appendChild(style);

  const label=recipeNav.querySelector('.nav-label');
  const icon=recipeNav.querySelector('.nav-icon');
  if(label)label.textContent='Preparación y Recetas';
  if(icon)icon.textContent='🥣';
  if(prepareNav)prepareNav.remove();

  const home=document.createElement('div');
  home.className='card';
  home.id='prepRecipesHome';
  home.innerHTML=`
    <h2>Preparación y Recetas</h2>
    <div class="notice">Elige exactamente lo que vas a hacer.</div>
    <div class="prep-recipes-menu">
      <button class="prep-recipes-choice" id="prepRecipesViewRecipes"><span class="ico">📖</span><span><b>Ver recetas</b><small>Consulta qué lleva cada producto y cuánto necesitas.</small></span></button>
      <button class="prep-recipes-choice" id="prepRecipesManual"><span class="ico">🥣</span><span><b>Preparar una receta</b><small>Elige un producto y una cantidad aunque no exista un pedido.</small></span></button>
      <button class="prep-recipes-choice" id="prepRecipesOrders"><span class="ico">🧾</span><span><b>Preparar pedidos</b><small>Solo muestra pedidos confirmados que realmente están pendientes de preparar.</small></span></button>
    </div>`;
  recipePanel.insertBefore(home,recipeCard);

  const ordersCard=document.createElement('div');
  ordersCard.className='card';
  ordersCard.id='prepRecipesOrdersCard';
  ordersCard.hidden=true;
  ordersCard.innerHTML=`<button class="prep-recipes-back" data-prep-home>← REGRESAR</button><h2>Preparar pedidos</h2><div class="notice">Aquí solo aparecen pedidos confirmados que todavía faltan preparar.</div><div class="prep-order-list" id="prepRecipesOrderList"></div>`;
  recipePanel.appendChild(ordersCard);

  const recipeBack=document.createElement('button');
  recipeBack.className='prep-recipes-back';
  recipeBack.type='button';
  recipeBack.textContent='← REGRESAR';
  recipeBack.dataset.prepHome='1';
  recipeCard.insertBefore(recipeBack,recipeCard.firstChild);
  recipeCard.hidden=true;

  const prepareBack=document.createElement('button');
  prepareBack.className='prep-recipes-back';
  prepareBack.type='button';
  prepareBack.textContent='← REGRESAR';
  prepareBack.dataset.prepHome='1';
  prepareCard.insertBefore(prepareBack,prepareCard.firstChild);

  function markCombinedActive(){
    document.querySelectorAll('#mainNav button').forEach(b=>b.classList.toggle('active',b===recipeNav));
  }

  function showHome(){
    activateTab('recipes');
    home.hidden=false;
    recipeCard.hidden=true;
    ordersCard.hidden=true;
    markCombinedActive();
  }

  function showRecipes(){
    activateTab('recipes');
    home.hidden=true;
    ordersCard.hidden=true;
    recipeCard.hidden=false;
    if(typeof renderRecipe==='function')renderRecipe();
    markCombinedActive();
  }

  function showManualPrep(){
    activateTab('prepare');
    if(typeof renderPrepare==='function')renderPrepare();
    markCombinedActive();
  }

  function pendingPrepOrders(){
    return (orders||[]).filter(o=>{
      const status=String(o.status||'nuevo');
      const stage=String(o.deliveryStatus||'por_preparar');
      return !o.deleted&&!o.directSale&&status==='confirmado'&&stage==='por_preparar'&&!o.inventoryConsumedAt;
    });
  }

  function renderPrepOrders(){
    const list=pendingPrepOrders();
    const box=document.getElementById('prepRecipesOrderList');
    if(!box)return;
    if(!list.length){
      box.innerHTML='<div class="empty">No hay pedidos confirmados pendientes de preparar.</div>';
      return;
    }
    box.innerHTML=list.map(o=>`<div class="prep-order-card">
      <strong>${esc(typeof orderTitle==='function'?orderTitle(o):(o.customer||'Pedido'))}</strong>
      <small>${esc(o.customer||'Cliente')}${o.deliveryDate?`<br>📅 ${esc(typeof formatOrderDate==='function'?formatOrderDate(o.deliveryDate):o.deliveryDate)}${o.time?` · ${esc(o.time)}`:''}`:''}</small>
      <button type="button" data-prep-order-id="${esc(o.id)}">🥣 PREPARAR ESTE PEDIDO</button>
    </div>`).join('');
  }

  function showOrders(){
    activateTab('recipes');
    home.hidden=true;
    recipeCard.hidden=true;
    ordersCard.hidden=false;
    renderPrepOrders();
    markCombinedActive();
  }

  document.getElementById('prepRecipesViewRecipes').onclick=showRecipes;
  document.getElementById('prepRecipesManual').onclick=showManualPrep;
  document.getElementById('prepRecipesOrders').onclick=showOrders;

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-prep-home]')){
      e.preventDefault();
      showHome();
      return;
    }
    const btn=e.target.closest('[data-prep-order-id]');
    if(!btn)return;
    const id=btn.dataset.prepOrderId;
    if(typeof prepareOrder==='function'){
      prepareOrder(id);
      queueMicrotask(markCombinedActive);
    }
  });

  const basePrepareOrder=typeof prepareOrder==='function'?prepareOrder:null;
  if(basePrepareOrder){
    prepareOrder=function(id){
      const result=basePrepareOrder(id);
      queueMicrotask(markCombinedActive);
      return result;
    };
  }

  recipeNav.addEventListener('click',()=>queueMicrotask(showHome));
})();
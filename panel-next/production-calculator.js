(()=>{
  const KEY='chava-panel-v3';
  const q=s=>document.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const qty=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:3});

  function open(){
    const db=read(),recipes=Array.isArray(db.recipes)?db.recipes:[],inventory=Array.isArray(db.inventory)?db.inventory:[];
    document.querySelector('#productionCalcModal')?.remove();
    const el=document.createElement('div');el.id='productionCalcModal';el.className='modal';
    const options=recipes.map(r=>`<option value="${esc(r.id)}">${esc(r.name||'Producto')}</option>`).join('');
    el.innerHTML=`<div class="sheet" style="max-width:560px"><div class="bar modal-bar"><h2>Calcular producción</h2><button class="icon" type="button" data-prod-close>×</button></div><div class="fields"><label>Producto<select id="prodRecipe">${options}</select></label><label>Libras a preparar<input id="prodLb" type="number" min="0.25" step="0.25" value="1"></label></div><button id="prodCalc" class="save" type="button">Calcular</button><div id="prodResult" style="margin-top:14px"></div></div>`;
    document.body.appendChild(el);
    const draw=()=>{
      const rid=q('#prodRecipe')?.value,lb=Number(q('#prodLb')?.value||0),r=recipes.find(x=>x.id===rid),box=q('#prodResult');
      if(!box)return;
      if(!r||lb<=0){box.innerHTML='<div class="empty">Selecciona producto y libras.</div>';return}
      const mult=lb/Number(r.yieldLb||1),lines=(r.ingredients||[]).map(line=>{
        const inv=inventory.find(i=>i.id===line.inventoryId);if(!inv)return '';
        return `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #e8e1d3"><strong>${esc(inv.name)}</strong><b>${qty(Number(line.qty||0)*mult)} ${esc(inv.unit||'')}</b></div>`;
      }).filter(Boolean).join('');
      box.innerHTML=`<div style="background:#f6f1e6;border-radius:14px;padding:14px;margin-bottom:10px"><span style="display:block;color:#666;font-size:13px">VAS A PREPARAR</span><strong style="font-size:28px">${qty(lb)} lb</strong></div>${lines||'<div class="empty">Esta receta no tiene ingredientes cargados.</div>'}`;
    };
    q('#prodCalc')?.addEventListener('click',draw);q('#prodLb')?.addEventListener('input',draw);q('#prodRecipe')?.addEventListener('change',draw);draw();
    el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-prod-close]'))el.remove()});
  }

  function inject(){
    const grid=q('#modules');if(!grid||grid.querySelector('[data-production-calc]'))return;
    const b=document.createElement('button');b.type='button';b.className='card mod-prep';b.dataset.productionCalc='1';b.innerHTML='<span>🧮</span><strong>Calcular producción</strong>';grid.appendChild(b);
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-production-calc]'))open()});
  new MutationObserver(inject).observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('load',()=>{inject();setTimeout(inject,300)});
})();

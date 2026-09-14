(()=>{
  const KEY='chava-panel-v3';
  const q=s=>document.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const write=data=>localStorage.setItem(KEY,JSON.stringify(data));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pendingExtras=null;

  function enhanceSaleForm(){
    const title=q('#formTitle'),fields=q('#formFields');
    if(!title||!fields||title.textContent.trim()!=='Nueva venta'||fields.dataset.saleEnhanced==='1')return;
    fields.dataset.saleEnhanced='1';
    const grid=fields.querySelector('.fields')||fields;
    grid.insertAdjacentHTML('beforeend',`
      <label>Cliente<input name="customer" type="text" autocomplete="name"></label>
      <label>Teléfono<input name="phone" type="tel" inputmode="tel" autocomplete="tel"></label>
      <label>Dirección<input name="address" type="text" autocomplete="street-address"></label>
      <label>Pago<select name="payment"><option value="">Seleccionar</option><option>Efectivo</option><option>Cash App</option><option>Square</option><option>Uber Pro Card</option><option>Chime</option><option>Otro</option></select></label>
    `);
    const recipe=grid.querySelector('[name="recipeId"]'),lbs=grid.querySelector('[name="qty"]'),total=grid.querySelector('[name="total"]');
    const fillTotal=()=>{
      if(!recipe||!lbs||!total)return;
      const db=read(),r=(db.recipes||[]).find(x=>x.id===recipe.value),price=Number(r?.price||0),n=Number(lbs.value||0);
      if(price>0&&n>0)total.value=(price*n).toFixed(2);
    };
    recipe?.addEventListener('change',fillTotal);lbs?.addEventListener('input',fillTotal);
    if(total&&!total.value)fillTotal();
  }

  document.addEventListener('submit',e=>{
    const form=e.target;
    if(form?.id!=='form'||q('#formTitle')?.textContent.trim()!=='Nueva venta')return;
    const fd=new FormData(form);
    pendingExtras={
      customer:String(fd.get('customer')||'').trim(),
      phone:String(fd.get('phone')||'').trim(),
      address:String(fd.get('address')||'').trim(),
      payment:String(fd.get('payment')||'').trim(),
      recipeId:String(fd.get('recipeId')||''),
      qty:Number(fd.get('qty')||0),
      total:Number(fd.get('total')||0),
      date:String(fd.get('date')||''),
      time:String(fd.get('time')||'')
    };
    setTimeout(()=>{
      if(!pendingExtras)return;
      const db=read(),sales=Array.isArray(db.sales)?db.sales:[];
      let row=[...sales].reverse().find(s=>String(s.recipeId||'')===pendingExtras.recipeId&&String(s.date||'')===pendingExtras.date&&String(s.time||'')===pendingExtras.time&&Math.abs(Number(s.qty||0)-pendingExtras.qty)<.001);
      if(!row)row=sales[sales.length-1];
      if(row){
        row.customer=pendingExtras.customer;row.phone=pendingExtras.phone;row.address=pendingExtras.address;row.payment=pendingExtras.payment;
        row.updatedAt=Date.now();db.updatedAt=Date.now();write(db);
      }
      pendingExtras=null;
    },120);
  },true);

  function decorateSales(){
    if(q('#screenTitle')?.textContent.trim()!=='Venta')return;
    const db=read(),sales=[...(db.sales||[])].sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`));
    const rows=[...document.querySelectorAll('#content .list .row')];
    rows.forEach((el,i)=>{
      const s=sales[i];if(!s||el.querySelector('.sale-extra'))return;
      const parts=[s.customer,s.phone,s.payment].filter(Boolean);
      if(parts.length){const d=document.createElement('div');d.className='muted sale-extra';d.textContent=parts.join(' · ');el.appendChild(d)}
      if(s.address){const d=document.createElement('div');d.className='address sale-extra';d.textContent=s.address;el.appendChild(d)}
    });
  }

  const obs=new MutationObserver(()=>{enhanceSaleForm();decorateSales()});
  obs.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('click',()=>setTimeout(()=>{enhanceSaleForm();decorateSales()},30),true);
  window.addEventListener('load',()=>{enhanceSaleForm();decorateSales()});
})();

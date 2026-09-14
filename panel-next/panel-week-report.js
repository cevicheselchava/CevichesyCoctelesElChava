(()=>{
  const KEY='chava-panel-v3';
  const q=s=>document.querySelector(s);
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
  const num=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
  const localDate=d=>{const x=new Date(d),y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),day=String(x.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  const today=()=>localDate(new Date());
  const salesWeek=()=>{const d=new Date(),day=d.getDay();let back=day===0?4:day>=3?day-3:day+4;const a=new Date(d);a.setDate(d.getDate()-back);const b=new Date(a);b.setDate(a.getDate()+4);return {a:localDate(a),b:localDate(b)}};
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const status=s=>({entregado:'delivered',delivered:'delivered',cancelado:'cancelled',cancelled:'cancelled'}[String(s||'').toLowerCase()]||String(s||'').toLowerCase());
  const pounds=o=>Number(o?.pounds ?? o?.qty ?? 0)||0;
  const between=(d,a,b)=>d&&d>=a&&d<=b;
  function summarize(a,b){
    const state=read(),days={};
    const ensure=d=>days[d]||(days[d]={date:d,lb:0,total:0,count:0});
    for(const s of state.sales||[]){if(!between(s.date,a,b))continue;const r=ensure(s.date);r.lb+=Number(s.qty||0);r.total+=Number(s.total||0);r.count++}
    for(const o of state.orders||[]){if(status(o.status)!=='delivered'||!between(o.date,a,b))continue;const r=ensure(o.date);r.lb+=pounds(o);r.total+=Number(o.total||0);r.count++}
    const rows=Object.values(days).sort((x,y)=>x.date.localeCompare(y.date));
    return {rows,lb:rows.reduce((s,r)=>s+r.lb,0),total:rows.reduce((s,r)=>s+r.total,0),count:rows.reduce((s,r)=>s+r.count,0)};
  }
  function close(){q('#weekReportModal')?.remove()}
  function draw(){
    const range=salesWeek(),a=q('#weekStart')?.value||range.a,b=q('#weekEnd')?.value||range.b,s=summarize(a,b),body=q('#weekReportBody');if(!body)return;
    const labels=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    body.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0 14px"><div style="background:#f6f1e6;border-radius:14px;padding:12px;text-align:center"><strong style="display:block;font-size:24px">${num(s.lb)}</strong><span style="font-size:12px;color:#666">libras</span></div><div style="background:#f6f1e6;border-radius:14px;padding:12px;text-align:center"><strong style="display:block;font-size:24px">${s.count}</strong><span style="font-size:12px;color:#666">ventas</span></div><div style="background:#f6f1e6;border-radius:14px;padding:12px;text-align:center"><strong style="display:block;font-size:20px">${money(s.total)}</strong><span style="font-size:12px;color:#666">total</span></div></div>${s.rows.length?`<div style="display:grid;gap:8px">${s.rows.map(r=>{const d=new Date(`${r.date}T12:00:00`);return `<div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid #e8e1d3;border-radius:12px"><strong>${labels[d.getDay()]} ${r.date}</strong><span>${num(r.lb)} lb</span><b>${money(r.total)}</b></div>`}).join('')}</div>`:`<div style="padding:18px;text-align:center;color:#777">No hay ventas registradas en ese rango.</div>`}<div style="font-size:12px;color:#777;margin-top:12px">Cuenta ventas directas y pedidos marcados como entregados en este panel.</div>`;
  }
  function open(){
    close();const range=salesWeek(),el=document.createElement('div');el.id='weekReportModal';el.className='modal';
    el.innerHTML=`<div class="sheet" style="max-width:560px"><div class="bar modal-bar"><h2>Resumen de ventas</h2><button class="icon" type="button" data-week-close>×</button></div><div style="font-size:13px;color:#666;margin:2px 0 8px">Por defecto muestra tu semana de venta: miércoles a domingo.</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 0 8px"><label>Desde<input id="weekStart" type="date" value="${range.a}"></label><label>Hasta<input id="weekEnd" type="date" value="${range.b}"></label></div><div id="weekReportBody"></div></div>`;
    document.body.appendChild(el);draw();el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-week-close]'))close()});q('#weekStart')?.addEventListener('change',draw);q('#weekEnd')?.addEventListener('change',draw);
  }
  function inject(){const grid=q('#modules');if(!grid||grid.querySelector('[data-week-report]'))return;const b=document.createElement('button');b.type='button';b.className='card mod-sales';b.dataset.weekReport='1';b.innerHTML='<span>📊</span><strong>Resumen</strong>';grid.appendChild(b)}
  document.addEventListener('click',e=>{if(e.target.closest('[data-week-report]'))open()});
  const obs=new MutationObserver(inject);obs.observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('load',()=>{inject();setTimeout(inject,400)});
})();

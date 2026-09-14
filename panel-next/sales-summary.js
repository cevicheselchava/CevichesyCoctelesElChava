(()=>{
  const KEY='chava-panel-v3';
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
  const qty=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2});
  const localDate=d=>{
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const today=()=>localDate(new Date());
  const parseDate=s=>{const [y,m,d]=String(s||'').split('-').map(Number);return y&&m&&d?new Date(y,m-1,d):null};
  const wedSunRange=()=>{
    const now=new Date(),day=now.getDay();
    let back;
    if(day===0) back=4;
    else if(day>=3) back=day-3;
    else back=day+4;
    const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-back);
    const end=new Date(start);end.setDate(start.getDate()+4);end.setHours(23,59,59,999);
    return {start,end};
  };
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
  const pounds=o=>Number(o?.pounds||o?.qty||0);
  const status=o=>String(o?.status||'').toLowerCase();
  const rows=()=>{
    const db=read();
    const direct=(Array.isArray(db.sales)?db.sales:[]).map(x=>({date:x.date||'',lb:pounds(x),total:Number(x.total||0),kind:'Venta'}));
    const delivered=(Array.isArray(db.orders)?db.orders:[])
      .filter(o=>['delivered','entregado'].includes(status(o)))
      .map(o=>({date:o.date||'',lb:pounds(o),total:Number(o.total||0),kind:'Pedido'}));
    return [...direct,...delivered].filter(x=>x.date);
  };
  const sum=list=>list.reduce((a,x)=>({lb:a.lb+Number(x.lb||0),total:a.total+Number(x.total||0),count:a.count+1}),{lb:0,total:0,count:0});
  const card=(label,s)=>`<div style="background:#fff;border:1px solid #e7dfcf;border-radius:16px;padding:14px;box-shadow:0 4px 16px rgba(0,0,0,.05)"><span style="display:block;font-size:12px;font-weight:800;color:#6b665e;text-transform:uppercase;letter-spacing:.04em">${label}</span><strong style="display:block;font-size:28px;line-height:1.05;margin-top:5px;color:#173d2d">${qty(s.lb)} lb</strong><b style="display:block;margin-top:5px;color:#0b8f4d">${money(s.total)}</b><small style="color:#777">${s.count} venta${s.count===1?'':'s'}</small></div>`;
  function inject(){
    const title=document.querySelector('#screenTitle'),content=document.querySelector('#content');
    if(!title||!content||title.textContent.trim()!=='Venta')return;
    content.querySelector('#salesSummaryPatch')?.remove();
    const data=rows(),t=today(),todaySum=sum(data.filter(x=>x.date===t)),range=wedSunRange();
    const period=data.filter(x=>{const d=parseDate(x.date);return d&&d>=range.start&&d<=range.end});
    const periodSum=sum(period);
    const byDay=['Miércoles','Jueves','Viernes','Sábado','Domingo'].map((name,i)=>{
      const d=new Date(range.start);d.setDate(range.start.getDate()+i);const ds=localDate(d),s=sum(data.filter(x=>x.date===ds));
      return `<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eee"><span>${name}<small style="display:block;color:#888">${ds}</small></span><strong>${qty(s.lb)} lb · ${money(s.total)}</strong></div>`;
    }).join('');
    const box=document.createElement('section');box.id='salesSummaryPatch';box.style.marginBottom='16px';
    box.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">${card('Hoy',todaySum)}${card('Mié–Dom',periodSum)}</div><details style="background:#fff;border:1px solid #e7dfcf;border-radius:14px;padding:12px"><summary style="font-weight:800;cursor:pointer">Ver libras por día</summary><div style="margin-top:7px">${byDay}</div></details>`;
    content.prepend(box);
  }
  let timer;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(inject,40)};
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  document.addEventListener('click',schedule,true);
  window.addEventListener('focus',schedule);
  schedule();
})();

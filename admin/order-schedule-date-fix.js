(()=>{
  if(window.__EL_CUBANO_ORDER_SCHEDULE_DATE_FIX__)return;
  window.__EL_CUBANO_ORDER_SCHEDULE_DATE_FIX__=true;

  const E=id=>document.getElementById(id);

  // Entregas cada 20 minutos: 3 espacios por hora, de 12:00 p. m. a 7:00 p. m.
  fillTimes=function(){
    const sel=E('moTime');
    if(!sel)return;
    const previous=sel.value;
    sel.innerHTML='';
    const fmt=m=>{
      let h=Math.floor(m/60),mi=m%60,p=h>=12?'p. m.':'a. m.';
      h=h%12||12;
      return `${h}:${String(mi).padStart(2,'0')} ${p}`;
    };
    for(let m=12*60;m<19*60;m+=20){
      const o=document.createElement('option');
      o.value=`${fmt(m)}–${fmt(m+20)}`;
      o.textContent=o.value;
      sel.appendChild(o);
    }
    if(previous&&[...sel.options].some(o=>o.value===previous))sel.value=previous;
    if(typeof renderTimeQuickButtons==='function')renderTimeQuickButtons();
  };

  // En Android, "Otra fecha" debe abrir el calendario aunque la fecha actual sea hoy/mañana.
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-date-mode="other"]');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const date=E('moDate');
    if(!date)return;
    date.hidden=false;
    document.querySelectorAll('[data-date-mode]').forEach(b=>b.classList.toggle('active',b===btn));

    try{
      date.focus({preventScroll:true});
      if(typeof date.showPicker==='function')date.showPicker();
      else date.click();
    }catch(_){
      date.focus();
    }
  },true);

  fillTimes();
})();

(()=>{
  if(window.__EL_CUBANO_PREPARE_RECIPE_V1__)return;
  window.__EL_CUBANO_PREPARE_RECIPE_V1__=true;

  const doc=document;
  const nav=doc.querySelector('.nav');
  const main=doc.querySelector('main.wrap');
  if(!nav||!main)return;

  const STORAGE_KEY='elCubanoPreparationV1';
  const COMMON_PER_LB={tomato:1.6,cucumber:1/6,onion:.8,cilantro:.2,lemonJuice:2.4,clamato:1.4};
  const TYPES={
    mixed:{name:'Ceviche mixto · pescado y camarón',proteins:{fish:.25,shrimp:.25}},
    fish:{name:'Ceviche de pescado',proteins:{fish:.5}},
    shrimp:{name:'Ceviche de camarón',proteins:{shrimp:.5}},
    octopusShrimp:{name:'Pulpo y camarón',proteins:{octopus:.25,shrimp:.25}},
    octopusFish:{name:'Pulpo y pescado',proteins:{octopus:.25,fish:.25}}
  };
  const ICONS={fish:'🐟',shrimp:'🍤',octopus:'🐙',tomato:'🍅',cucumber:'🥒',onion:'🧅',cilantro:'🌿',lemonJuice:'🍋',clamato:'🥤'};
  const FALLBACK_NAMES={fish:'Filete de pescado',shrimp:'Camarón',octopus:'Tentáculo de pulpo',tomato:'Tomate',cucumber:'Pepino',onion:'Cebolla morada',cilantro:'Cilantro',lemonJuice:'Jugo de limón',clamato:'Clamato'};
  const FALLBACK_UNITS={fish:'lb',shrimp:'lb',octopus:'lb',tomato:'oz',cucumber:'pzas',onion:'oz',cilantro:'oz',lemonJuice:'fl oz',clamato:'fl oz'};

  const round3=value=>Math.round((Number(value)+Number.EPSILON)*1000)/1000;
  const itemName=key=>(typeof ITEMS!=='undefined'&&ITEMS[key]?.name)||FALLBACK_NAMES[key]||key;
  const itemUnit=key=>(typeof ITEMS!=='undefined'&&ITEMS[key]?.unit)||FALLBACK_UNITS[key]||'';
  const amount=(key,value)=>`${Number(round3(value).toFixed(3))} ${itemUnit(key)}`;

  function loadSession(){
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(value&&Array.isArray(value.steps)){
        const cucumber=value.steps.find(step=>step.key==='cucumber');
        if(cucumber&&value.pounds>0&&cucumber.qty>1){
          cucumber.qty=round3(Number(value.pounds)/6);
          saveSession(value);
        }
        return value;
      }
      return null;
    }catch{return null;}
  }
  function saveSession(value){
    try{
      if(value)localStorage.setItem(STORAGE_KEY,JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    }catch{}
  }

  let session=loadSession();

  const style=doc.createElement('style');
  style.id='prepare-recipe-v1-style';
  style.textContent=`
    #prepare .prep-config{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px}
    #prepare .prep-config .full{grid-column:1/-1}
    #prepare .prep-start{width:100%;border:0;border-radius:14px;padding:14px;background:var(--green);color:#fff;font-weight:1000;font-size:16px}
    #prepare .prep-start:disabled{opacity:.5}
    #prepare .prep-progress{margin:12px 0;padding:12px 14px;border-radius:14px;background:#eef5ff;border:1px solid #b9cce8;color:var(--navy);font-weight:900}
    #prepare .prep-progress-bar{height:10px;margin-top:8px;border-radius:999px;background:#dfe6ec;overflow:hidden}
    #prepare .prep-progress-bar span{display:block;height:100%;background:var(--green);transition:width .2s ease}
    #prepare .prep-current{border:2px solid #f0d999;border-radius:18px;padding:16px;background:#fffaf0;margin:12px 0}
    #prepare .prep-current.done{border-color:#a7d8b3;background:#f1fff4}
    #prepare .prep-step-label{font-size:12px;font-weight:1000;color:var(--muted);letter-spacing:.04em}
    #prepare .prep-current-name{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--navy);font-size:24px;font-weight:1000}
    #prepare .prep-current-icon{font-size:32px}
    #prepare .prep-current-qty{margin-top:8px;font-size:20px;font-weight:1000;color:var(--red)}
    #prepare .prep-confirm{width:100%;margin-top:13px;border:0;border-radius:14px;padding:14px;background:var(--green);color:#fff;font-size:16px;font-weight:1000}
    #prepare .prep-list{display:grid;gap:7px;margin-top:12px}
    #prepare .prep-row{display:grid;grid-template-columns:42px 1fr auto;gap:9px;align-items:center;border:1px solid var(--line);border-radius:13px;padding:10px;background:#fff}
    #prepare .prep-row.current{border-color:#e9c557;background:#fffdf2}
    #prepare .prep-row.checked{border-color:#b9dec2;background:#f4fff6}
    #prepare .prep-row-icon{font-size:24px;text-align:center}
    #prepare .prep-row strong{display:block;color:var(--navy)}
    #prepare .prep-row small{display:block;color:var(--muted);margin-top:3px;font-weight:800}
    #prepare .prep-status{font-size:12px;font-weight:1000;border-radius:999px;padding:6px 8px;background:#eef1f4;color:#687386;white-space:nowrap}
    #prepare .prep-row.checked .prep-status{background:#dff4e3;color:#176b2c}
    #prepare .prep-row.current .prep-status{background:#fff0bf;color:#7d5300}
    #prepare .prep-actions{display:grid;grid-template-columns:1fr 1.5fr;gap:8px;margin-top:13px}
    #prepare .prep-actions button{border:0;border-radius:13px;padding:13px;font-weight:1000}
    #prepare .prep-undo{background:#e8edf4;color:var(--navy)}
    #prepare .prep-ready{background:var(--green);color:#fff}
    #prepare .prep-ready:disabled{background:#d8ddd9;color:#7f8781}
    #prepare .prep-finished{margin-top:12px;padding:16px;border-radius:16px;background:#e9f9ec;border:2px solid #91cda0;color:#176b2c;text-align:center;font-size:20px;font-weight:1000}
    #prepare .prep-reset{width:100%;margin-top:10px;border:0;border-radius:12px;padding:11px;background:#fff0ed;color:#a72a22;font-weight:1000}
    @media(max-width:560px){#prepare .prep-config{grid-template-columns:1fr}#prepare .prep-config .full{grid-column:1}#prepare .prep-actions{grid-template-columns:1fr}.prep-row{grid-template-columns:36px 1fr auto!important}}
  `;
  doc.head.appendChild(style);

  const button=doc.createElement('button');
  button.type='button';
  button.dataset.tab='prepare';
  button.innerHTML='<span class="nav-icon">👨‍🍳</span><span class="nav-label">Preparar</span>';
  const recipesButton=nav.querySelector('button[data-tab="recipes"]');
  if(recipesButton)recipesButton.after(button);else nav.appendChild(button);

  const panel=doc.createElement('section');
  panel.className='panel';
  panel.id='prepare';
  panel.innerHTML=`
    <div class="card">
      <h2>Preparar receta</h2>
      <div class="notice">Te va pidiendo cada ingrediente conforme preparas. <b>No se puede marcar “Receta lista” hasta haber agregado todos.</b></div>
      <div class="prep-config">
        <label class="full">Receta
          <select id="prepType">
            <option value="mixed">Ceviche mixto · pescado y camarón</option>
            <option value="fish">Ceviche de pescado</option>
            <option value="shrimp">Ceviche de camarón</option>
            <option value="octopusShrimp">Pulpo y camarón</option>
            <option value="octopusFish">Pulpo y pescado</option>
          </select>
        </label>
        <label>Libras a preparar<input id="prepPounds" type="number" min="0.5" step="0.5" value="6"></label>
        <div style="display:flex;align-items:end"><button type="button" class="prep-start" id="prepStart">Iniciar preparación</button></div>
      </div>
      <div id="prepWorkspace"></div>
    </div>`;
  const recipesPanel=doc.getElementById('recipes');
  const historyPanel=doc.getElementById('history');
  if(recipesPanel)recipesPanel.after(panel);else if(historyPanel)main.insertBefore(panel,historyPanel);else main.appendChild(panel);

  const typeInput=panel.querySelector('#prepType');
  const poundsInput=panel.querySelector('#prepPounds');
  const workspace=panel.querySelector('#prepWorkspace');
  const startButton=panel.querySelector('#prepStart');

  function buildSteps(type,pounds){
    const recipe=TYPES[type]||TYPES.mixed;
    const required={};
    Object.entries(recipe.proteins).forEach(([key,value])=>required[key]=round3(value*pounds));
    Object.entries(COMMON_PER_LB).forEach(([key,value])=>required[key]=round3(value*pounds));
    const order=[...Object.keys(recipe.proteins),'tomato','cucumber','onion','cilantro','lemonJuice','clamato'];
    return order.filter(key=>Number(required[key])>0).map(key=>({key,qty:required[key],done:false,doneAt:null}));
  }

  function plannerValues(){
    const plannerType=doc.getElementById('recipeType');
    const plannerPounds=doc.getElementById('recipePounds');
    if(plannerType&&TYPES[plannerType.value])typeInput.value=plannerType.value;
    const lb=Number(plannerPounds?.value);
    if(lb>0)poundsInput.value=String(lb);
  }

  function currentIndex(){return session?.steps?.findIndex(step=>!step.done)??-1;}
  function doneCount(){return session?.steps?.filter(step=>step.done).length||0;}
  function allDone(){return Boolean(session?.steps?.length)&&session.steps.every(step=>step.done);}

  function render(){
    if(!session){
      typeInput.disabled=false;poundsInput.disabled=false;startButton.disabled=false;
      workspace.innerHTML='';
      return;
    }
    typeInput.value=session.type;
    poundsInput.value=String(session.pounds);
    typeInput.disabled=true;poundsInput.disabled=true;startButton.disabled=true;

    const total=session.steps.length;
    const completed=doneCount();
    const idx=currentIndex();
    const percent=total?Math.round(completed/total*100):0;
    let current='';

    if(session.ready){
      const when=session.completedAt?new Date(session.completedAt).toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'}):'';
      current=`<div class="prep-finished">✅ RECETA LISTA<br><small>${TYPES[session.type]?.name||'Receta'} · ${session.pounds} lb${when?' · '+when:''}</small></div>`;
    }else if(idx>=0){
      const step=session.steps[idx];
      current=`<div class="prep-current"><div class="prep-step-label">PASO ${idx+1} DE ${total}</div><div class="prep-current-name"><span class="prep-current-icon">${ICONS[step.key]||'✓'}</span>${itemName(step.key)}</div><div class="prep-current-qty">Agrega ${amount(step.key,step.qty)}</div><button type="button" class="prep-confirm" data-prep-index="${idx}">✓ Ya agregué este ingrediente</button></div>`;
    }else{
      current='<div class="prep-current done"><div class="prep-current-name"><span class="prep-current-icon">✅</span>Todos los ingredientes están agregados</div><div class="prep-current-qty" style="color:var(--green)">Ya puedes marcar la receta como lista.</div></div>';
    }

    const rows=session.steps.map((step,index)=>{
      const isCurrent=!session.ready&&index===idx;
      const state=step.done?'Agregado ✓':isCurrent?'Ahora':'Pendiente';
      return `<div class="prep-row ${step.done?'checked':''} ${isCurrent?'current':''}"><div class="prep-row-icon">${ICONS[step.key]||'✓'}</div><div><strong>${itemName(step.key)}</strong><small>${amount(step.key,step.qty)}</small></div><span class="prep-status">${state}</span></div>`;
    }).join('');

    workspace.innerHTML=`
      <div class="prep-progress">${TYPES[session.type]?.name||'Receta'} · ${session.pounds} lb<br>${completed} de ${total} ingredientes agregados<div class="prep-progress-bar"><span style="width:${percent}%"></span></div></div>
      ${current}
      <div class="prep-list">${rows}</div>
      <div class="prep-actions">
        <button type="button" class="prep-undo" id="prepUndo" ${completed===0||session.ready?'disabled':''}>↩ Deshacer último</button>
        <button type="button" class="prep-ready" id="prepReady" ${!allDone()||session.ready?'disabled':''}>✅ Marcar receta lista</button>
      </div>
      <button type="button" class="prep-reset" id="prepReset">Empezar otra preparación</button>`;
  }

  function start(){
    const type=TYPES[typeInput.value]?typeInput.value:'mixed';
    const pounds=Math.max(.5,Math.round((Number(poundsInput.value)||.5)*2)/2);
    session={type,pounds,steps:buildSteps(type,pounds),ready:false,startedAt:new Date().toISOString(),completedAt:null};
    saveSession(session);render();
  }

  function mark(index){
    if(!session||session.ready)return;
    const idx=currentIndex();
    if(index!==idx)return;
    session.steps[index].done=true;
    session.steps[index].doneAt=new Date().toISOString();
    saveSession(session);render();
    if(typeof toast==='function')toast(`${itemName(session.steps[index].key)} agregado`);
  }

  function undo(){
    if(!session||session.ready)return;
    for(let i=session.steps.length-1;i>=0;i--){
      if(session.steps[i].done){session.steps[i].done=false;session.steps[i].doneAt=null;break;}
    }
    saveSession(session);render();
  }

  function ready(){
    if(!session||session.ready||!allDone())return;
    session.ready=true;
    session.completedAt=new Date().toISOString();
    saveSession(session);render();
    if(typeof toast==='function')toast('Receta lista');
  }

  function reset(){
    if(session&&!session.ready&&!confirm('La preparación todavía no está lista. ¿Quieres empezar otra?'))return;
    session=null;saveSession(null);plannerValues();render();
  }

  function activate(){
    doc.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
    doc.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    button.classList.add('active');panel.classList.add('active');
    if(!session)plannerValues();
    render();
  }

  button.addEventListener('click',activate);
  startButton.addEventListener('click',start);
  workspace.addEventListener('click',event=>{
    const confirmButton=event.target.closest('[data-prep-index]');
    if(confirmButton){mark(Number(confirmButton.dataset.prepIndex));return;}
    if(event.target.closest('#prepUndo')){undo();return;}
    if(event.target.closest('#prepReady')){ready();return;}
    if(event.target.closest('#prepReset'))reset();
  });

  render();
})();
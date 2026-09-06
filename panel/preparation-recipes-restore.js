(()=>{
'use strict';
if(window.__PANEL_PREPARATION_UI__)return;
window.__PANEL_PREPARATION_UI__=true;

const PROFILE=window.PANEL_PROFILE||{};
const ITEMS=PROFILE.items||{};
const PRODUCTS=PROFILE.products||{};
const E=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
const r3=n=>Math.round((Number(n||0)+Number.EPSILON)*1000)/1000;
const n2=n=>Number(Number(n||0).toFixed(2));
const add=(out,key,value)=>{if(Number(value)>0)out[key]=r3(Number(out[key]||0)+Number(value));};

const screen=document.querySelector('[data-screen="prepare"]');
if(!screen)return;
const head=screen.querySelector('.screen-head');
const totals=E('prepTotals');
const extraPanel=E('extraInputs')?.closest('.panel-card');
const ordersPanel=E('prepareOrders')?.closest('.panel-card');
if(!head||!extraPanel||!ordersPanel)return;

const style=document.createElement('style');
style.textContent=`
  .app{max-width:760px}
  .hero{padding-top:12px}
  .brand-logo{width:88px!important;height:88px!important}
  .brand-copy h1{font-size:30px!important}
  .home-grid{gap:8px}
  .home-card{min-height:112px!important;border-radius:15px!important;padding:12px 10px!important}
  .home-card.money{min-height:96px!important}
  .home-icon{font-size:31px!important;margin-bottom:5px!important}
  .home-card strong{font-size:17px!important}
  .home-card small{font-size:12px!important;margin-top:4px!important}
  .go{width:32px!important;height:32px!important;font-size:25px!important;right:10px!important;bottom:9px!important}
  .summary-card,.panel-card{border-radius:15px!important;padding:12px!important;margin-top:10px!important;box-shadow:0 4px 12px rgba(34,48,38,.07)!important}
  .screen-head{margin:5px 0 8px!important}
  .screen-head h2{font-size:25px!important}
  .screen-head p{font-size:13px!important}
  .back,.close{width:40px!important;height:40px!important;font-size:29px!important}
  .prep-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 9px;position:sticky;top:0;z-index:20;background:#fff8e9;padding:5px 0}
  .prep-tabs button{border:1px solid #d8d0c1;background:#fff;border-radius:11px;padding:10px 5px;font-weight:900;color:#355247;font-size:14px}
  .prep-tabs button.active{background:#0d8f41;color:#fff;border-color:#0d8f41}
  .prep-totals{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;margin-bottom:8px}
  .prep-summary-box{border-radius:11px!important;padding:8px 5px!important}
  .prep-summary-box small{font-size:10px!important}
  .prep-summary-box b{font-size:14px!important;line-height:1.15!important;margin-top:3px!important}
  .extra-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin:8px 0!important}
  .extra-item{padding:8px!important;border-radius:11px!important}
  .extra-item span{font-size:14px!important}
  .extra-item input{padding:9px!important;font-size:18px!important}
  .primary,.secondary,.danger{padding:11px 12px!important;border-radius:11px!important}
  button[data-prepared-order]{font-size:0!important}
  button[data-prepared-order]::after{content:'🥣 PREPARAR PEDIDO';font-size:14px;font-weight:1000}
  .recipe-grid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:9px}
  .recipe-guide-product{border:1px solid #e4dccd;border-radius:12px;background:#fff;padding:10px}
  .recipe-guide-product>strong{display:block;color:#174f2b;font-size:16px;margin-bottom:5px}
  .recipe-guide-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #eee6d8;font-size:14px}
  .recipe-guide-row:last-child{border-bottom:0}
  .recipe-guide-row span{font-weight:700;color:#41544b}
  .recipe-guide-row b{color:#174f2b;white-space:nowrap}
  @media(max-width:620px){
    .app{padding:0 8px 20px!important}
    .brand-wrap{gap:8px!important}
    .brand-logo{width:72px!important;height:72px!important}
    .brand-copy h1{font-size:25px!important}
    .brand-copy .business-name{font-size:15px!important}
    .hero-tools{margin-top:7px!important}
    .today-pill,.mini-btn{padding:7px 10px!important;font-size:12px!important}
    .home-card{min-height:102px!important}
    .home-card.money{min-height:88px!important}
    .prep-totals{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .prep-summary-box b{font-size:12px!important}
    .panel-title h3{font-size:20px!important}
    .panel-title small{font-size:12px!important}
  }
`;
document.head.appendChild(style);

const title=head.querySelector('h2');
const subtitle=head.querySelector('p');
if(title)title.textContent='Producción';
if(subtitle)subtitle.textContent='Pedidos, extra y recetas.';

const homeCard=document.querySelector('.home-card[data-go="prepare"]');
if(homeCard){
  const strong=homeCard.querySelector('strong');
  const small=homeCard.querySelector('small');
  if(strong)strong.textContent='Producción';
  if(small)small.textContent='Pedidos · Extra · Recetas';
}

const tabs=document.createElement('div');
tabs.className='prep-tabs';
tabs.innerHTML=`
  <button type="button" class="active" data-prep-tab="orders">🧾 Pedidos</button>
  <button type="button" data-prep-tab="extra">🥣 Extra</button>
  <button type="button" data-prep-tab="recipes">📖 Recetas</button>`;
head.insertAdjacentElement('afterend',tabs);

const recipesCard=document.createElement('section');
recipesCard.id='recipeGuideCard';
recipesCard.className='panel-card recipe-guide-card';
recipesCard.hidden=true;
ordersPanel.insertAdjacentElement('afterend',recipesCard);

function unitText(key,value){
  const item=ITEMS[key]||{},v=Number(value||0),unit=String(item.unit||'');
  if(unit==='lb')return `${n2(v*16)} oz`;
  if(unit==='pzas')return `${n2(v)} pzas`;
  if(unit==='oz')return `${n2(v)} oz`;
  if(unit==='fl oz')return `${n2(v)} fl oz`;
  return `${n2(v)} ${unit}`.trim();
}

function recipeFor(pkey){
  const p=PRODUCTS[pkey]||{},out={};
  if(typeof PROFILE.buildRecipe==='function')return PROFILE.buildRecipe(pkey,1,'',add,r3)||{};
  Object.entries(p.recipe||{}).forEach(([k,v])=>add(out,k,Number(v||0)));
  return out;
}

function renderRecipes(){
  recipesCard.innerHTML=`<div class="panel-title"><div><h3>Recetas</h3><small>Cantidad para preparar una unidad de cada producto.</small></div></div>
  <div class="recipe-grid">${Object.entries(PRODUCTS).map(([pkey,p])=>{
    const rows=Object.entries(recipeFor(pkey)).filter(([k,v])=>ITEMS[k]&&Number(v)>0).map(([k,v])=>`<div class="recipe-guide-row"><span>${esc(ITEMS[k].name)}</span><b>${esc(unitText(k,v))}</b></div>`).join('');
    return `<article class="recipe-guide-product"><strong>${esc(p.name||p.short||pkey)}</strong>${rows||'<small>Sin ingredientes configurados.</small>'}</article>`;
  }).join('')}</div>`;
}
renderRecipes();

function showTab(name){
  tabs.querySelectorAll('[data-prep-tab]').forEach(b=>b.classList.toggle('active',b.dataset.prepTab===name));
  if(totals)totals.hidden=false;
  ordersPanel.hidden=name!=='orders';
  extraPanel.hidden=name!=='extra';
  recipesCard.hidden=name!=='recipes';
  if(name==='recipes')renderRecipes();
}

tabs.addEventListener('click',e=>{
  const b=e.target.closest('[data-prep-tab]');
  if(b)showTab(b.dataset.prepTab);
});

document.addEventListener('click',e=>{
  if(e.target.closest('[data-go="prepare"]'))setTimeout(()=>showTab('orders'),0);
});

showTab('orders');
})();

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

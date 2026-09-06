(()=>{
'use strict';
if(window.__PANEL_PREPARATION_RECIPES_RESTORE__)return;
window.__PANEL_PREPARATION_RECIPES_RESTORE__=true;

const PROFILE=window.PANEL_PROFILE||{};
const ITEMS=PROFILE.items||{};
const PRODUCTS=PROFILE.products||{};
const E=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&#39;"}[c]));
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
if(title)title.textContent='Preparación y Recetas';
if(subtitle)subtitle.textContent='Elige exactamente lo que vas a hacer.';

const homeCard=document.querySelector('.home-card[data-go="prepare"]');
if(homeCard){
  const strong=homeCard.querySelector('strong');
  const small=homeCard.querySelector('small');
  if(strong)strong.textContent='Preparación y Recetas';
  if(small)small.textContent='Ver recetas · Preparar pedidos';
}

const style=document.createElement('style');
style.textContent=`
  .prep-recipes-menu{display:grid;gap:11px}
  .prep-recipes-choice{width:100%;border:1px solid #ded7c8;border-radius:17px;background:#fff;padding:15px;text-align:left;display:grid;grid-template-columns:48px 1fr;gap:11px;align-items:center;box-shadow:0 5px 14px rgba(22,50,72,.07)}
  .prep-recipes-choice .ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#eef8ef;font-size:27px}
  .prep-recipes-choice b{display:block;color:#174f2b;font-size:18px}
  .prep-recipes-choice small{display:block;color:#687386;margin-top:4px;font-weight:800;line-height:1.35}
  .prep-recipes-back{width:100%;margin-bottom:12px;border:1px solid #cad9eb;border-radius:12px;padding:11px;background:#eef3f8;color:#123458;font-weight:1000}
  .recipe-guide-product{border:1px solid #ded7c8;border-radius:14px;padding:13px;background:#fff;margin-top:10px}
  .recipe-guide-product>strong{display:block;color:#174f2b;font-size:17px;margin-bottom:6px}
  .recipe-guide-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:7px 0;border-bottom:1px solid #eee6d8}
  .recipe-guide-row:last-child{border-bottom:0}
  .recipe-guide-row span{color:#334155;font-weight:800}
  .recipe-guide-row b{color:#174f2b;white-space:nowrap}
`;
document.head.appendChild(style);

const menu=document.createElement('section');
menu.id='prepRecipesMenu';
menu.className='panel-card';
menu.innerHTML=`<div class="panel-title"><h3>Preparación y Recetas</h3><small>Elige lo que quieres hacer.</small></div>
  <div class="prep-recipes-menu">
    <button type="button" class="prep-recipes-choice" data-prep-view="recipes"><span class="ico">📖</span><span><b>Ver recetas</b><small>Consulta qué lleva cada producto y sus cantidades.</small></span></button>
    <button type="button" class="prep-recipes-choice" data-prep-view="manual"><span class="ico">🥣</span><span><b>Preparar una receta</b><small>Registra lo que vas a preparar además de los pedidos.</small></span></button>
    <button type="button" class="prep-recipes-choice" data-prep-view="orders"><span class="ico">🧾</span><span><b>Preparar pedidos</b><small>Muestra los pedidos confirmados que todavía faltan preparar.</small></span></button>
  </div>`;
head.insertAdjacentElement('afterend',menu);

const recipesCard=document.createElement('section');
recipesCard.id='recipeGuideCard';
recipesCard.className='panel-card';
recipesCard.hidden=true;
menu.insertAdjacentElement('afterend',recipesCard);

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
  const cards=Object.entries(PRODUCTS).map(([pkey,p])=>{
    const recipe=recipeFor(pkey);
    const rows=Object.entries(recipe).filter(([k,v])=>ITEMS[k]&&Number(v)>0).map(([k,v])=>`<div class="recipe-guide-row"><span>${esc(ITEMS[k].name)}</span><b>${esc(unitText(k,v))}</b></div>`).join('');
    return `<div class="recipe-guide-product"><strong>${esc(p.name||p.short||pkey)} · receta para 1 ${esc(p.unit||'')}</strong>${rows||'<small>Sin ingredientes configurados.</small>'}</div>`;
  }).join('');
  recipesCard.innerHTML=`<button type="button" class="prep-recipes-back" data-prep-menu-back>← REGRESAR</button><div class="panel-title"><h3>📖 Recetas</h3><small>Estas son las cantidades guardadas actualmente en el panel.</small></div>${cards}`;
}
renderRecipes();

function ensureBack(panel){
  if(panel.querySelector('[data-prep-menu-back]'))return;
  const b=document.createElement('button');
  b.type='button';b.className='prep-recipes-back';b.dataset.prepMenuBack='1';b.textContent='← REGRESAR';
  panel.insertBefore(b,panel.firstChild);
}
ensureBack(extraPanel);
ensureBack(ordersPanel);

function fixPrepareButtons(){
  E('prepareOrders')?.querySelectorAll('[data-prepared-order]').forEach(btn=>{
    btn.textContent='🥣 PREPARAR ESTE PEDIDO';
  });
}
fixPrepareButtons();
const ordersBox=E('prepareOrders');
if(ordersBox)new MutationObserver(fixPrepareButtons).observe(ordersBox,{childList:true,subtree:true});

function hideAll(){
  if(totals)totals.hidden=true;
  extraPanel.hidden=true;
  ordersPanel.hidden=true;
  recipesCard.hidden=true;
}
function showMenu(){
  hideAll();
  menu.hidden=false;
}
function showRecipes(){
  hideAll();menu.hidden=true;recipesCard.hidden=false;renderRecipes();
}
function showManual(){
  hideAll();menu.hidden=true;extraPanel.hidden=false;if(totals)totals.hidden=false;
}
function showOrders(){
  hideAll();menu.hidden=true;ordersPanel.hidden=false;if(totals)totals.hidden=false;fixPrepareButtons();
}

menu.addEventListener('click',e=>{
  const b=e.target.closest('[data-prep-view]');
  if(!b)return;
  if(b.dataset.prepView==='recipes')showRecipes();
  else if(b.dataset.prepView==='manual')showManual();
  else if(b.dataset.prepView==='orders')showOrders();
});
screen.addEventListener('click',e=>{if(e.target.closest('[data-prep-menu-back]'))showMenu();});
document.addEventListener('click',e=>{if(e.target.closest('[data-go="prepare"]'))setTimeout(showMenu,0);});

showMenu();
})();

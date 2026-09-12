(()=>{
  'use strict';
  function applyFlavor(){
    const style=document.createElement('style');
    style.id='customer-flavor-20260912';
    style.textContent=`
      :root{--cream:#fff3d2!important}
      html{background:#fff3d2!important}
      body{
        background:
          radial-gradient(circle at 50% 8%,rgba(255,247,207,.96) 0 18%,rgba(255,239,188,.90) 44%,rgba(255,248,226,.96) 100%)!important;
      }
      body::before{
        display:block!important;
        opacity:.035!important;
        background:url('/ceviche-real.svg') center 35%/760px auto no-repeat!important;
      }
      .hero{
        background:linear-gradient(180deg,rgba(255,252,239,.93),rgba(255,246,218,.90))!important;
        border-color:rgba(224,203,159,.78)!important;
      }
      .customer-brand-row{margin:0 auto 10px!important}
      .main-logo{
        width:min(285px,78vw)!important;
        max-height:285px!important;
        mix-blend-mode:normal!important;
        filter:drop-shadow(0 5px 8px rgba(30,67,42,.13))!important;
      }
      .customer-brand-copy{display:none!important}
      .hero .benefits .benefit,.notice,.availability-note,.product,.checkout{
        background:rgba(255,255,255,.90)!important;
      }
      @media(max-width:430px){.main-logo{width:min(270px,76vw)!important}}
    `;
    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);

    const hero=document.querySelector('.hero');
    const logo=hero?.querySelector('.main-logo');
    if(logo){
      logo.src='/assets/logo.png?v=20260912-flavor1';
      logo.alt='El Cubano';
    }
    hero?.querySelector('.customer-brand-copy')?.remove();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(applyFlavor,0),{once:true});
  else setTimeout(applyFlavor,0);
})();
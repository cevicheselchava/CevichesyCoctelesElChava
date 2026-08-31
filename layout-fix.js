(() => {
  'use strict';

  const STYLE_ID = 'el-cubano-layout-fix-20260831';

  function injectStyles() {
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Rendimiento móvil: misma apariencia, menos capas pesadas al hacer scroll */
      html{scroll-behavior:auto!important}
      body{
        background:
          linear-gradient(rgba(255,248,232,.91),rgba(255,248,232,.95)),
          url('/el-cubano-logo-transparent.png') center 680px/360px auto no-repeat!important;
        background-attachment:scroll!important;
      }
      body::before{
        position:absolute!important;
        opacity:.055!important;
        background-attachment:scroll!important;
        filter:none!important;
      }
      body::after{display:none!important}
      .hero,#customer-category-nav,.cart-backdrop{
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
      }
      .section[data-group]>.products,
      .product,.benefit,.notice,.availability-note,
      #customer-category-nav button,.sticky{
        transition:none!important;
        animation:none!important;
      }

      /* Todas las categorías parten cerradas; solo abre la que toque el cliente */
      .section[data-group]:not(.open)>.products{
        max-height:0!important;
        opacity:0!important;
        overflow:hidden!important;
        margin-top:0!important;
        pointer-events:none!important;
      }
      .section[data-group].open>.products{
        max-height:none!important;
        opacity:1!important;
        overflow:visible!important;
        margin-top:10px!important;
        pointer-events:auto!important;
      }

      /* Avisos inferiores con más aire */
      #customer-info-after-menu{margin-top:18px!important}
      #customer-info-after-menu .notice,
      #customer-info-after-menu .availability-note{
        margin:13px 0!important;
        padding:16px 17px!important;
        font-size:18px!important;
        line-height:1.38!important;
        background:rgba(255,255,255,.90)!important;
      }
      .credit{padding-top:24px!important;padding-bottom:92px!important;line-height:1.28!important}

      /* Carrito flotante compacto, como la app anterior */
      .sticky{
        left:auto!important;
        right:16px!important;
        bottom:14px!important;
        width:auto!important;
        max-width:calc(100vw - 28px)!important;
        min-height:58px!important;
        padding:6px 8px!important;
        border-radius:999px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:linear-gradient(95deg,#0aa84b,#22cf67)!important;
        box-shadow:0 7px 16px rgba(5,92,42,.20)!important;
        border:0!important;
      }
      .sticky .summary{
        width:auto!important;
        flex:0 0 auto!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        min-width:0!important;
        padding:0!important;
      }
      .summary b{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:9px!important;
        width:auto!important;
        white-space:nowrap!important;
      }
      .summary b::before{
        font-size:19px!important;
        line-height:1!important;
      }
      .summary b span{
        margin-left:0!important;
        min-width:76px!important;
        padding:8px 11px!important;
        font-size:18px!important;
        line-height:1!important;
      }
      .send{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        opacity:0!important;
        z-index:3!important;
        border-radius:999px!important;
      }

      @media(max-width:700px){
        /* Jerarquía correcta: categorías dominan; tarjetas informativas acompañan */
        .benefits{
          grid-template-columns:1fr 1fr!important;
          gap:7px!important;
          margin:9px 0 8px!important;
        }
        .benefit{
          min-height:68px!important;
          padding:8px 7px 9px!important;
          text-align:center!important;
          font-size:13px!important;
          line-height:1.12!important;
          border-radius:15px!important;
          box-shadow:0 3px 8px rgba(28,52,67,.045)!important;
        }
        .benefit b{
          font-size:15px!important;
          line-height:1.1!important;
          margin-bottom:2px!important;
        }

        #customer-category-nav{
          margin-top:14px!important;
          margin-bottom:18px!important;
          gap:7px!important;
          padding:7px!important;
        }
        #customer-category-nav button{
          min-width:0!important;
          min-height:100px!important;
          padding:10px 4px 12px!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:center!important;
          justify-content:center!important;
          gap:5px!important;
        }
        #customer-category-nav .cat-icon{
          font-size:27px!important;
          line-height:1!important;
        }
        #customer-category-nav .cat-label{
          display:block!important;
          width:100%!important;
          font-size:15px!important;
          line-height:1.08!important;
          font-weight:1000!important;
          white-space:normal!important;
          overflow:visible!important;
          text-overflow:clip!important;
          overflow-wrap:normal!important;
          word-break:normal!important;
          text-align:center!important;
        }

        .product{
          grid-template-columns:108px minmax(0,1fr)!important;
          grid-template-rows:auto auto!important;
          column-gap:12px!important;
          row-gap:10px!important;
          align-items:start!important;
          padding:12px!important;
          border-radius:22px!important;
          box-shadow:0 4px 11px rgba(23,49,68,.055)!important;
        }
        .approved-product-image{
          grid-column:1!important;
          grid-row:1/3!important;
          width:108px!important;
          height:108px!important;
          align-self:center!important;
          border-radius:17px!important;
        }
        .product>.approved-copy{
          grid-column:2!important;
          grid-row:1!important;
          min-width:0!important;
        }
        .product h3{
          font-size:21px!important;
          line-height:1.08!important;
          overflow-wrap:anywhere!important;
        }
        .meta{
          font-size:17px!important;
          line-height:1.25!important;
          margin-top:5px!important;
        }
        .tag,.promo-save{font-size:13px!important;padding:5px 8px!important}

        .product>.bottom{
          grid-column:2!important;
          grid-row:2!important;
          display:flex!important;
          flex-direction:column!important;
          align-items:stretch!important;
          gap:8px!important;
          width:100%!important;
          min-width:0!important;
          margin:0!important;
        }
        .price{
          width:100%!important;
          max-width:none!important;
          min-width:0!important;
          padding:9px 12px!important;
          font-size:27px!important;
          line-height:1!important;
          white-space:nowrap!important;
        }
        .price small{display:none!important}
        .qty{
          width:100%!important;
          display:grid!important;
          grid-template-columns:44px 38px minmax(0,1fr)!important;
          align-items:center!important;
          gap:7px!important;
          justify-content:stretch!important;
          font-size:20px!important;
        }
        .qty button{
          width:44px!important;
          height:44px!important;
          flex:none!important;
        }
        .qty span{
          display:block!important;
          text-align:center!important;
          min-width:0!important;
        }
        .qty .plus{
          width:100%!important;
          min-width:0!important;
          height:44px!important;
          padding:0 12px!important;
        }
        .qty .plus::after{font-size:18px!important}

        #customer-info-after-menu .notice,
        #customer-info-after-menu .availability-note{
          font-size:17px!important;
          padding:15px 16px!important;
        }
      }

      @media(max-width:430px){
        .benefit{
          min-height:64px!important;
          padding:7px 6px 8px!important;
          font-size:12.5px!important;
        }
        .benefit b{font-size:14px!important}

        #customer-category-nav button{
          min-height:96px!important;
          padding:9px 3px 11px!important;
        }
        #customer-category-nav .cat-icon{font-size:26px!important}
        #customer-category-nav .cat-label{font-size:14px!important;line-height:1.08!important}

        .product{grid-template-columns:98px minmax(0,1fr)!important;column-gap:10px!important}
        .approved-product-image{width:98px!important;height:98px!important}
        .product h3{font-size:19px!important}
        .meta{font-size:16px!important}
        .price{font-size:25px!important}
        .qty{grid-template-columns:42px 34px minmax(0,1fr)!important;gap:6px!important}
        .qty button{width:42px!important;height:42px!important}
        .qty .plus{height:42px!important}
        .qty .plus::after{font-size:17px!important}
        .sticky{right:12px!important;bottom:12px!important;min-height:56px!important;padding:6px 7px!important}
        .summary b::before{font-size:18px!important}
        .summary b span{font-size:17px!important;min-width:70px!important;padding:8px 10px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function closeAllCategories() {
    document.querySelectorAll('.section[data-group]').forEach(section => {
      section.classList.remove('open');
      section.querySelector('.section-title')?.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('#customer-category-nav button[data-group]').forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    });
  }

  function setupCategoryState() {
    const nav = document.getElementById('customer-category-nav');
    if (!nav || nav.dataset.cleanToggle === '1') return;
    nav.dataset.cleanToggle = '1';

    nav.addEventListener('click', event => {
      const button = event.target.closest('button[data-group]');
      if (!button) return;
      queueMicrotask(() => {
        nav.querySelectorAll('button[data-group]').forEach(item => {
          item.setAttribute('aria-pressed', item.classList.contains('active') ? 'true' : 'false');
        });
      });
    });
  }

  function startAtTop() {
    try { history.scrollRestoration = 'manual'; } catch (_) {}
    window.scrollTo(0, 0);
  }

  function applyFixes() {
    injectStyles();
    closeAllCategories();
    setupCategoryState();
    startAtTop();
  }

  applyFixes();

  const headObserver = new MutationObserver(mutations => {
    const approvedAdded = mutations.some(mutation =>
      [...mutation.addedNodes].some(node => node?.id === 'el-cubano-approved-ui')
    );
    if (!approvedAdded) return;
    injectStyles();
    closeAllCategories();
    headObserver.disconnect();
  });
  headObserver.observe(document.head, { childList:true });

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      injectStyles();
      closeAllCategories();
    });
  }, { once:true });
})();

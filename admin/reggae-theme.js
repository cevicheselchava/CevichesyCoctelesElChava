(()=>{
  if(window.__EL_CUBANO_REGGAE_THEME_V1__)return;
  window.__EL_CUBANO_REGGAE_THEME_V1__=true;

  const st=document.createElement('style');
  st.id='el-cubano-reggae-theme-v1';
  st.textContent=`
    body{
      background:
        linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,243,232,.98)),
        linear-gradient(90deg,#b8232f 0 33%,#e9b832 33% 66%,#24723c 66% 100%)!important;
    }

    .hero{
      position:relative!important;
      overflow:hidden!important;
      background:linear-gradient(135deg,#102a1a 0%,#1d6337 58%,#245f35 100%)!important;
      border:1px solid #2d7b48!important;
      box-shadow:0 10px 24px rgba(16,42,26,.20)!important;
      padding-bottom:21px!important;
    }
    .hero:after{
      content:"";position:absolute;left:0;right:0;bottom:0;height:8px;
      background:linear-gradient(90deg,#c92f35 0 33.33%,#efc13d 33.33% 66.66%,#2b8a49 66.66% 100%);
    }
    .hero img{border:2px solid #efc13d!important;box-shadow:0 4px 12px rgba(0,0,0,.18)!important}
    .hero h1{color:#fff!important;text-shadow:0 1px 0 rgba(0,0,0,.18)}
    .hero p{color:#fff6cf!important}

    .sync{
      border-color:#b8d7bd!important;
      background:linear-gradient(135deg,#f4fff5,#fff9df)!important;
      box-shadow:0 4px 12px rgba(33,139,57,.06)!important;
    }

    .stat,.card{
      position:relative!important;
      overflow:hidden!important;
      border-color:#ded7c8!important;
      box-shadow:0 6px 16px rgba(33,55,42,.07)!important;
    }
    .card{padding-top:18px!important}
    .card:before{
      content:"";position:absolute;left:0;right:0;top:0;height:5px;
      background:linear-gradient(90deg,#c92f35 0 33.33%,#efc13d 33.33% 66.66%,#2b8a49 66.66% 100%);
    }
    .card h2{color:#174f2b!important}

    .stats .stat:nth-child(1){border-top:4px solid #c92f35!important}
    .stats .stat:nth-child(2){border-top:4px solid #efc13d!important}
    .stats .stat:nth-child(3){border-top:4px solid #2b8a49!important}
    .stats .stat:nth-child(4){border-top:4px solid #c92f35!important}
    .stat b{color:#174f2b!important}
    .stat.alert b{color:#b41f29!important}

    .notice{
      background:linear-gradient(135deg,#fff8dc,#f2fbf3)!important;
      border-color:#e4cf8e!important;
      color:#294333!important;
      border-left:5px solid #efc13d!important;
    }

    .order,.inv,.movement{
      box-shadow:0 4px 12px rgba(20,45,31,.05)!important;
      border-color:#e1dacd!important;
    }
    .order{border-left:5px solid #2b8a49!important}
    .order:nth-child(3n+2){border-left-color:#efc13d!important}
    .order:nth-child(3n){border-left-color:#c92f35!important}
    .movement{border-left:5px solid #efc13d!important}
    .inv{border-left:5px solid #2b8a49!important}
    .inv.low{border-left-color:#c92f35!important}
    .order strong,.inv strong,.movement strong{color:#174f2b!important}

    .group-title{
      color:#fff!important;
      background:linear-gradient(135deg,#174f2b,#267642)!important;
      border-left:6px solid #c92f35!important;
      box-shadow:inset 0 -4px 0 #efc13d!important;
      padding-bottom:12px!important;
    }

    input,select{
      border-color:#d7cfbf!important;
      background:#fffefb!important;
    }
    input:focus,select:focus{
      border-color:#2b8a49!important;
      outline:3px solid rgba(239,193,61,.22)!important;
    }
    label{color:#174f2b!important}

    .primary,.success{
      background:linear-gradient(135deg,#25793f,#319552)!important;
      color:#fff!important;
      box-shadow:inset 0 -4px 0 #efc13d,0 5px 12px rgba(37,121,63,.16)!important;
    }
    .secondary{
      background:#fff2bf!important;
      color:#5f4600!important;
      border:1px solid #ead17a!important;
    }
    .danger{
      background:#ffe8e8!important;
      color:#a51620!important;
      border:1px solid #efb6b8!important;
    }
    .purchase-group{background:#f2eee4!important;color:#174f2b!important}
    .purchase-group.active{
      background:linear-gradient(135deg,#174f2b,#267642)!important;
      color:#fff!important;
      box-shadow:inset 0 -4px 0 #efc13d!important;
    }

    .nav.stable-big-nav{
      background:linear-gradient(180deg,#fff,#fffaf0)!important;
      border-color:#ddd4c5!important;
      box-shadow:0 10px 26px rgba(23,79,43,.12)!important;
    }
    .nav.stable-big-nav button[data-tab]{
      background:linear-gradient(145deg,#fff,#f7f3e8)!important;
      border-color:#e2dacd!important;
    }
    .nav.stable-big-nav button[data-tab].active{
      background:linear-gradient(135deg,#174f2b,#2b8a49)!important;
      box-shadow:0 9px 19px rgba(23,79,43,.28)!important;
    }
    .nav.stable-big-nav button[data-tab].active .nav-icon{
      box-shadow:0 0 0 2px #efc13d,0 4px 10px rgba(0,0,0,.14)!important;
    }

    .manual-sheet{
      border-top:7px solid transparent!important;
      border-image:linear-gradient(90deg,#c92f35 0 33.33%,#efc13d 33.33% 66.66%,#2b8a49 66.66% 100%) 1!important;
      background:linear-gradient(180deg,#fffefb,#fff9ed)!important;
    }
    .manual-summary{background:linear-gradient(135deg,#f0fbf2,#fff7d8)!important;border-color:#c8d9b9!important}
    .manual-add,.manual-save{background:linear-gradient(135deg,#25793f,#319552)!important;box-shadow:inset 0 -4px 0 #efc13d!important}

    .route-block-title{
      background:linear-gradient(90deg,#eef8f0,#fff8db)!important;
      color:#174f2b!important;
      border-left:5px solid #c92f35!important;
    }
    .route-card{border-left:5px solid #2b8a49!important}

    .toast{background:#183523!important;border-bottom:4px solid #efc13d!important}
  `;
  document.head.appendChild(st);
})();
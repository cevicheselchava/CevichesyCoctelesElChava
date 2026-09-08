if (typeof document !== 'undefined' && !document.getElementById('prepReadableTextStyles')) {
  const style = document.createElement('style');
  style.id = 'prepReadableTextStyles';
  style.textContent = `
    .prep-dish-section-title h4{font-size:29px!important;line-height:1.15!important}
    .prep-dish-section-title small{font-size:18px!important;line-height:1.25!important}
    .prep-dish-ingredient span{font-size:21px!important;line-height:1.3!important}
    .prep-dish-ingredient strong{font-size:22px!important;line-height:1.2!important}
    .prep-dish-procedure li{font-size:21px!important;line-height:1.48!important}
    .prep-procedure-pending{font-size:20px!important;line-height:1.4!important}

    .prep-dish-head small{font-size:15px!important}
    .prep-dish-head h3{font-size:28px!important;line-height:1.15!important}
    .prep-dish-head>span{font-size:17px!important}
    .prep-dish-stat small,.prep-dish-input small{font-size:16px!important;line-height:1.25!important}
    .prep-dish-stat strong{font-size:22px!important;line-height:1.2!important}
    .prep-dish-input input{font-size:23px!important}
    .prep-dish-input span{font-size:20px!important}

    .prep-dish-picker-copy strong{font-size:23px!important}
    .prep-dish-picker-copy small{font-size:17px!important}
    .prep-dish-option span{font-size:20px!important}
    .prep-dish-option small{font-size:17px!important}

    @media(max-width:720px){
      .prep-dish-section-title h4{font-size:28px!important}
      .prep-dish-section-title small{font-size:18px!important}
      .prep-dish-ingredient span{font-size:21px!important}
      .prep-dish-ingredient strong{font-size:22px!important}
      .prep-dish-procedure li{font-size:21px!important}
      .prep-dish-head h3{font-size:27px!important}
    }
  `;
  document.head.appendChild(style);
}

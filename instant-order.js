(() => {
  const buttonId = 'instant-order-button';
  const styleId = 'instant-order-button-style';

  if (document.getElementById(buttonId)) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .instant-order-button{
        display:flex;
        align-items:center;
        justify-content:center;
        width:100%;
        margin:10px 0;
        min-height:52px;
        padding:13px 16px;
        border-radius:13px;
        background:#25d366;
        color:#fff;
        text-decoration:none;
        font-size:17px;
        font-weight:1000;
        box-shadow:0 6px 14px rgba(37,211,102,.25);
      }
      .instant-order-button:active{transform:translateY(1px)}
    `;
    document.head.appendChild(style);
  }

  const message = 'Hola, vengo desde la app y quiero pedir para ahorita. ¿Qué tienes disponible y en cuánto tiempo me lo puedes entregar?';
  const whatsappUrl = `https://wa.me/12109432119?text=${encodeURIComponent(message)}`;

  const button = document.createElement('a');
  button.id = buttonId;
  button.className = 'instant-order-button';
  button.href = whatsappUrl;
  button.target = '_blank';
  button.rel = 'noopener';
  button.textContent = '⚡ PEDIR PARA AHORITA';

  hero.insertAdjacentElement('afterend', button);
})();

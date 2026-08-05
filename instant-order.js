(() => {
  const cardId = 'instant-order-card';
  const styleId = 'instant-order-style';

  if (document.getElementById(cardId)) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .instant-order-card{
        margin:10px 0;
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:center;
        gap:12px;
        padding:14px;
        border-radius:16px;
        border:1px solid rgba(34,152,58,.35);
        background:linear-gradient(135deg,rgba(235,255,239,.96),rgba(255,255,255,.94));
        box-shadow:0 6px 16px rgba(6,37,77,.08);
      }
      .instant-order-copy h2{
        margin:0 0 4px;
        color:#06254d;
        font-size:21px;
        line-height:1.15;
      }
      .instant-order-copy p{
        margin:0;
        color:#47566b;
        font-size:14px;
        font-weight:700;
      }
      .instant-order-copy small{
        display:block;
        margin-top:4px;
        color:#6c7788;
        font-size:12px;
        font-weight:700;
      }
      .instant-order-button{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:48px;
        padding:12px 16px;
        border-radius:13px;
        background:#25d366;
        color:#fff;
        text-decoration:none;
        font-size:15px;
        font-weight:1000;
        white-space:nowrap;
        box-shadow:0 6px 14px rgba(37,211,102,.25);
      }
      .instant-order-button:active{transform:translateY(1px)}
      @media(max-width:560px){
        .instant-order-card{grid-template-columns:1fr;text-align:center}
        .instant-order-button{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  const message = 'Hola, vengo desde la app y quiero pedir para ahorita. ¿Qué tienes disponible y en cuánto tiempo me lo puedes entregar?';
  const whatsappUrl = `https://wa.me/12109432119?text=${encodeURIComponent(message)}`;

  const card = document.createElement('section');
  card.id = cardId;
  card.className = 'instant-order-card';
  card.setAttribute('aria-label', 'Pedido para ahorita');
  card.innerHTML = `
    <div class="instant-order-copy">
      <h2>⚡ ¿Lo quieres para ahorita?</h2>
      <p>Consulta disponibilidad inmediata por WhatsApp.</p>
      <small>Sujeto a disponibilidad y tiempo de entrega.</small>
    </div>
    <a class="instant-order-button" href="${whatsappUrl}" target="_blank" rel="noopener">
      PEDIR PARA AHORITA
    </a>
  `;

  hero.insertAdjacentElement('afterend', card);
})();

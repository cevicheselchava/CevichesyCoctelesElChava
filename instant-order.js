(() => {
  const buttonId = 'instant-order-button';
  const styleId = 'instant-order-button-style';

  const localDateString = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const formatSlot = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const period = hour >= 12 ? 'p. m.' : 'a. m.';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const refreshTwentyMinuteSlots = () => {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    if (!dateInput || !timeSelect) return;

    const selectedDate = dateInput.value;
    const previousTime = timeSelect.value;
    timeSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    if (!selectedDate) return;

    const now = new Date();
    const today = localDateString(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = 20;
    const firstSlot = 11 * 60;
    const closingTime = 19 * 60;
    const minimumToday = Math.ceil((currentMinutes + 30) / slotMinutes) * slotMinutes;

    for (let minutes = firstSlot; minutes < closingTime; minutes += slotMinutes) {
      if (selectedDate === today && minutes < minimumToday) continue;
      const option = document.createElement('option');
      option.value = option.textContent = formatSlot(minutes);
      timeSelect.appendChild(option);
    }

    if ([...timeSelect.options].some((option) => option.value === previousTime)) {
      timeSelect.value = previousTime;
    }
  };

  const dateInput = document.getElementById('date');
  if (dateInput && !dateInput.dataset.twentyMinuteSchedule) {
    dateInput.dataset.twentyMinuteSchedule = 'true';
    dateInput.addEventListener('change', refreshTwentyMinuteSlots);
    setTimeout(refreshTwentyMinuteSlots, 0);
  }

  const availabilityNote = document.querySelector('.availability-note');
  if (availabilityNote) {
    availabilityNote.innerHTML = '⏰ <b>Entregas en horarios de 20 minutos.</b> Cantidad limitada por día y sujeta a disponibilidad.';
  }

  if (document.getElementById(buttonId)) return;

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .instant-order-wrap{
        margin:14px 0 6px;
        padding:14px;
        border:1px solid rgba(225,219,207,.92);
        border-radius:20px;
        background:rgba(255,255,255,.88);
        box-shadow:0 8px 22px rgba(24,49,73,.07);
        text-align:center;
      }
      .instant-order-wrap strong{display:block;color:#123458;font-size:16px;margin-bottom:8px}
      .instant-order-button{
        display:flex;
        align-items:center;
        justify-content:center;
        width:100%;
        min-height:52px;
        padding:13px 16px;
        border-radius:15px;
        background:linear-gradient(135deg,#f2b632,#e8a61e);
        color:#123458;
        text-decoration:none;
        font-size:17px;
        font-weight:1000;
        border:1px solid rgba(211,154,22,.55);
        box-shadow:0 7px 16px rgba(198,143,20,.16);
      }
      .instant-order-button:active{transform:translateY(1px)}
    `;
    document.head.appendChild(style);
  }

  const message = 'Hola, vengo desde la app y quiero pedir para ahorita. ¿Qué tienes disponible y en cuánto tiempo me lo puedes entregar?';
  const whatsappUrl = `https://wa.me/12109432119?text=${encodeURIComponent(message)}`;

  const wrap = document.createElement('div');
  wrap.className = 'instant-order-wrap';
  wrap.innerHTML = `<strong>¿Lo necesitas para ahorita?</strong>`;

  const button = document.createElement('a');
  button.id = buttonId;
  button.className = 'instant-order-button';
  button.href = whatsappUrl;
  button.target = '_blank';
  button.rel = 'noopener';
  button.textContent = '⚡ PEDIR PARA AHORITA';
  wrap.appendChild(button);

  const checkout = document.getElementById('checkout');
  if (checkout) checkout.insertAdjacentElement('afterend', wrap);
  else document.querySelector('main.wrap')?.appendChild(wrap);
})();
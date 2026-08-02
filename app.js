const WHATSAPP_NUMBER = "12109432119";

const products = [
  {
    id: "combo_constructor",
    group: "promotions",
    name: "👷 Combo Constructor",
    detail: "1 lb de ceviche de pescado + 1 cóctel chico",
    price: 22,
    featured: true
  },
  {
    id: "combo_hambre",
    group: "promotions",
    name: "💪 Combo Hambre",
    detail: "1 lb de ceviche de camarón + 1 cóctel chico",
    price: 27,
    featured: true
  },
  {
    id: "combo_camaradas",
    group: "promotions",
    name: "👷‍♂️ Combo Camaradas",
    detail: "1 lb de pescado + 1 lb de camarón + 2 cócteles chicos",
    price: 49,
    featured: true
  },

  {
    id: "fish_half",
    group: "immediate",
    name: "Ceviche de pescado",
    detail: "½ libra",
    price: 8
  },
  {
    id: "fish_lb",
    group: "immediate",
    name: "Ceviche de pescado",
    detail: "1 libra",
    price: 15
  },
  {
    id: "shrimp_half",
    group: "immediate",
    name: "Ceviche de camarón",
    detail: "½ libra",
    price: 11
  },
  {
    id: "shrimp_lb",
    group: "immediate",
    name: "Ceviche de camarón",
    detail: "1 libra",
    price: 20
  },
  {
    id: "mixed_half",
    group: "immediate",
    name: "Ceviche mixto",
    detail: "Pescado y camarón · ½ libra",
    price: 13
  },
  {
    id: "mixed_lb",
    group: "immediate",
    name: "Ceviche mixto",
    detail: "Pescado y camarón · 1 libra",
    price: 25
  },

  {
    id: "cocktail_shrimp_small",
    group: "cocktails",
    name: "Cóctel de camarón",
    detail: "Chico · 12 oz",
    price: null
  },
  {
    id: "cocktail_shrimp_medium",
    group: "cocktails",
    name: "Cóctel de camarón",
    detail: "Mediano · 16 oz",
    price: null
  },
  {
    id: "cocktail_mixed_small",
    group: "cocktails",
    name: "Cóctel mixto",
    detail: "Camarón y pulpo · Chico · 12 oz · Sobre pedido",
    price: null
  },
  {
    id: "cocktail_mixed_medium",
    group: "cocktails",
    name: "Cóctel mixto",
    detail: "Camarón y pulpo · Mediano · 16 oz · Sobre pedido",
    price: null
  },

  {
    id: "octopus_fish_half",
    group: "preorder",
    name: "Ceviche de pulpo y pescado",
    detail: "½ libra · Sobre pedido",
    price: 13
  },
  {
    id: "octopus_fish_lb",
    group: "preorder",
    name: "Ceviche de pulpo y pescado",
    detail: "1 libra · Sobre pedido",
    price: 25
  },
  {
    id: "octopus_shrimp_half",
    group: "preorder",
    name: "Ceviche de pulpo y camarón",
    detail: "½ libra · Sobre pedido",
    price: 13
  },
  {
    id: "octopus_shrimp_lb",
    group: "preorder",
    name: "Ceviche de pulpo y camarón",
    detail: "1 libra · Sobre pedido",
    price: 25
  },

  {
    id: "soda",
    group: "drinks",
    name: "Refresco",
    detail: "Sabores sujetos a disponibilidad",
    price: 2.5
  }
];

const quantities = {};

products.forEach((product) => {
  quantities[product.id] = 0;
});

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function createProductCard(product) {
  const quantity = quantities[product.id];
  const unavailable = product.price === null;

  return `
    <article class="product-card ${product.featured ? "featured" : ""}">
      <h3>${product.name}</h3>

      <p>${product.detail}</p>

      <span class="product-price">
        ${unavailable ? "Precio pendiente" : money(product.price)}
      </span>

      ${
        unavailable
          ? `
            <p>
              El precio se agregará cuando se confirme el costo
              de los ingredientes en San Antonio.
            </p>
          `
          : `
            <div class="product-controls">

              <button
                class="qty-button"
                type="button"
                data-action="remove"
                data-id="${product.id}"
                aria-label="Quitar producto"
              >
                −
              </button>

              <div class="qty-value">
                ${quantity}
              </div>

              <button
                class="qty-button"
                type="button"
                data-action="add"
                data-id="${product.id}"
                aria-label="Agregar producto"
              >
                +
              </button>

            </div>
          `
      }
    </article>
  `;
}

function renderProducts() {
  const groups = [
    "promotions",
    "immediate",
    "cocktails",
    "preorder",
    "drinks"
  ];

  groups.forEach((group) => {
    const container = document.getElementById(group);

    if (!container) {
      return;
    }

    container.innerHTML = products
      .filter((product) => product.group === group)
      .map(createProductCard)
      .join("");
  });

  updateOrderSummary();
}

function changeQuantity(productId, amount) {
  if (!(productId in quantities)) {
    return;
  }

  quantities[productId] = Math.max(
    0,
    quantities[productId] + amount
  );

  renderProducts();
}

function getSelectedProducts() {
  return products.filter(
    (product) =>
      product.price !== null &&
      quantities[product.id] > 0
  );
}

function calculateTotal() {
  return getSelectedProducts().reduce(
    (total, product) =>
      total + product.price * quantities[product.id],
    0
  );
}

function updateOrderSummary() {
  const selectedProducts = getSelectedProducts();

  const totalQuantity = selectedProducts.reduce(
    (total, product) =>
      total + quantities[product.id],
    0
  );

  const totalElement = document.getElementById("total");
  const summaryElement = document.getElementById("summary");

  totalElement.textContent = money(calculateTotal());

  summaryElement.textContent =
    totalQuantity > 0
      ? `${totalQuantity} producto(s) seleccionado(s)`
      : "Agrega productos para continuar";
}

function setupProductButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const productId = button.dataset.id;
    const action = button.dataset.action;

    if (action === "add") {
      changeQuantity(productId, 1);
    }

    if (action === "remove") {
      changeQuantity(productId, -1);
    }
  });
}

function setupAccordions() {
  const buttons = document.querySelectorAll(
    ".section-toggle"
  );

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.dataset.target;
      const panel = document.getElementById(panelId);

      if (!panel) {
        return;
      }

      const isOpen =
        button.getAttribute("aria-expanded") === "true";

      button.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

      panel.hidden = isOpen;
    });
  });
}

function setupDeliveryDate() {
  const dateInput = document.getElementById("date");

  const today = new Date();

  const localDate = new Date(
    today.getTime() -
      today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  dateInput.min = localDate;
}

function setupDeliveryTimes() {
  const timeSelect = document.getElementById("time");

  for (let hour = 11; hour <= 18; hour += 1) {
    [0, 30].forEach((minutes) => {
      const hourValue = String(hour).padStart(2, "0");
      const minuteValue = String(minutes).padStart(2, "0");

      const hour12 =
        hour > 12 ? hour - 12 : hour;

      const period =
        hour >= 12 ? "PM" : "AM";

      const value = `${hourValue}:${minuteValue}`;
      const label = `${hour12}:${minuteValue} ${period}`;

      const option = document.createElement("option");

      option.value = value;
      option.textContent = label;

      timeSelect.appendChild(option);
    });
  }

  const lastOption = document.createElement("option");

  lastOption.value = "19:00";
  lastOption.textContent = "7:00 PM";

  timeSelect.appendChild(lastOption);
}

function fieldValue(id) {
  const element = document.getElementById(id);

  return element ? element.value.trim() : "";
}

function validateOrder() {
  const requiredFields = [
    "name",
    "phone",
    "date",
    "time",
    "address",
    "zip"
  ];

  let valid = true;

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);

    if (!fieldValue(fieldId)) {
      field.classList.add("error");
      valid = false;
    } else {
      field.classList.remove("error");
    }
  });

  if (!getSelectedProducts().length) {
    alert("Agrega al menos un producto al pedido.");
    return false;
  }

  if (!valid) {
    document
      .getElementById("checkout")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    setTimeout(() => {
      alert(
        "Completa nombre, teléfono, día, hora, dirección y ZIP Code."
      );
    }, 300);

    return false;
  }

  return true;
}

function buildOrderMessage() {
  if (!validateOrder()) {
    return null;
  }

  const selectedProducts = getSelectedProducts();

  const productLines = selectedProducts
    .map((product) => {
      const quantity = quantities[product.id];
      const subtotal = product.price * quantity;

      return (
        `• ${quantity} x ${product.name}\n` +
        `  ${product.detail}\n` +
        `  ${money(subtotal)}`
      );
    })
    .join("\n\n");

  return `
🦐 *NUEVO PEDIDO*
*CEVICHES Y COCTELES EL CHAVA*

${productLines}

💵 *TOTAL: ${money(calculateTotal())}*

👤 *Nombre:* ${fieldValue("name")}
📞 *Teléfono:* ${fieldValue("phone")}
📅 *Día:* ${fieldValue("date")}
🕒 *Hora:* ${fieldValue("time")}
📍 *Dirección:* ${fieldValue("address")}
🏷️ *ZIP Code:* ${fieldValue("zip")}
💳 *Forma de pago:* ${fieldValue("payment")}
📝 *Notas:* ${fieldValue("notes") || "Sin notas"}

💯 Pedido seguro
💵 Sin anticipos
🚚 Paga al recibir
  `.trim();
}

function sendNormalWhatsApp() {
  const message = buildOrderMessage();

  if (!message) {
    return;
  }

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}` +
    `?text=${encodeURIComponent(message)}`;

  window.location.href = url;
}

function sendBusinessWhatsApp() {
  const message = buildOrderMessage();

  if (!message) {
    return;
  }

  const encodedMessage = encodeURIComponent(message);

  const businessIntent =
    `intent://send?phone=${WHATSAPP_NUMBER}` +
    `&text=${encodedMessage}` +
    `#Intent;scheme=whatsapp;` +
    `package=com.whatsapp.w4b;end`;

  window.location.href = businessIntent;
}

function removeErrorWhenTyping() {
  const fields = document.querySelectorAll(
    "input, select, textarea"
  );

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      field.classList.remove("error");
    });

    field.addEventListener("change", () => {
      field.classList.remove("error");
    });
  });
}

document
  .getElementById("sendNormal")
  .addEventListener(
    "click",
    sendNormalWhatsApp
  );

document
  .getElementById("sendBusiness")
  .addEventListener(
    "click",
    sendBusinessWhatsApp
  );

setupProductButtons();
setupAccordions();
setupDeliveryDate();
setupDeliveryTimes();
removeErrorWhenTyping();
renderProducts();
const cartItems = document.getElementById("cartItems");
const subtotalElement = document.getElementById("subtotal");
const grandTotalElement = document.getElementById("grandTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function refreshCartCount() {
  if (typeof updateCartCount === "function") {
    updateCartCount();
  }
}

function renderCart() {
  cartItems.innerHTML = "";

  // Empty-cart state
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some boxing equipment before continuing to checkout.</p>
        <a href="shop.html" class="btn">Browse Products</a>
      </div>
    `;

    subtotalElement.textContent = "$0.00";
    grandTotalElement.textContent = "$0.00";

    checkoutBtn.classList.add("disabled");
    checkoutBtn.setAttribute("aria-disabled", "true");
    checkoutBtn.removeAttribute("href");

    refreshCartCount();
    return;
  }

  // Enable checkout when products exist
  checkoutBtn.classList.remove("disabled");
  checkoutBtn.setAttribute("aria-disabled", "false");
  checkoutBtn.setAttribute("href", "checkout.html");

  let subtotal = 0;

  cart.forEach(item => {
    const priceNumber = Number(
      String(item.price).replace("$", "").replace(",", "")
    );

    const quantity = Number(item.quantity) || 1;
    const itemTotal = priceNumber * quantity;

    subtotal += itemTotal;

    cartItems.innerHTML += `
      <div class="cart-product">
        <div class="product-info">
          <img src="${item.image}" alt="${item.title}">
          <div>
            <h3>${item.title}</h3>
            <button
              type="button"
              onclick="removeItem('${item.id}')">
              Remove
            </button>
          </div>
        </div>

        <span>${item.price}</span>

        <div class="qty">
          <button
            type="button"
            aria-label="Decrease quantity"
            onclick="changeQuantity('${item.id}', -1)">
            -
          </button>

          <span>${quantity}</span>

          <button
            type="button"
            aria-label="Increase quantity"
            onclick="changeQuantity('${item.id}', 1)">
            +
          </button>
        </div>

        <strong>$${itemTotal.toFixed(2)}</strong>
      </div>
    `;
  });

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  grandTotalElement.textContent = `$${subtotal.toFixed(2)}`;

  refreshCartCount();
}

function changeQuantity(id, amount) {
  const item = cart.find(product => product.id === id);

  // Prevent an error if the cart item cannot be found
  if (!item) {
    return;
  }

  item.quantity = Number(item.quantity) + amount;

  if (item.quantity <= 0) {
    cart = cart.filter(product => product.id !== id);
  }

  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(product => product.id !== id);

  saveCart();
  renderCart();
}

renderCart();
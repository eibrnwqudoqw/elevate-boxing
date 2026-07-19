const cart = JSON.parse(localStorage.getItem("cart")) || [];

if (cart.length === 0) {
  window.location.replace("cart.html");
}

const checkoutItems = document.getElementById("checkoutItems");
const subtotalElement = document.getElementById("checkoutSubtotal");
const shippingElement = document.getElementById("checkoutShipping");
const totalElement = document.getElementById("checkoutTotal");

let subtotal = 0;

cart.forEach(item => {
  const price = Number(
	  String(item.price).replace(/[$,]/g, "")
	);
  const itemTotal = price * item.quantity;

  subtotal += itemTotal;

  checkoutItems.innerHTML += `
    <div class="summary-row">
      <span>${item.title} × ${item.quantity}</span>
      <strong>$${itemTotal.toFixed(2)}</strong>
    </div>
  `;
});

const shipping = 0;
const total = subtotal;

subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
shippingElement.textContent = "FREE";
shippingElement.style.color = "#28a745";
totalElement.textContent = `$${total.toFixed(2)}`;


// Checkout button
const stripeCheckoutBtn = document.getElementById("stripeCheckoutBtn");

stripeCheckoutBtn.addEventListener("click", async () => {
  

  const originalButtonText = stripeCheckoutBtn.textContent;

  try {
    // Stop customers clicking multiple times
    stripeCheckoutBtn.disabled = true;
    stripeCheckoutBtn.textContent = "Opening Secure Checkout...";

    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cart })
    });

    const data = await response.json();

    // Catch server errors such as invalid products or quantities
    if (!response.ok) {
      throw new Error(
        data.error || "Checkout could not be started."
      );
    }

    // Make sure Stripe returned a checkout URL
    if (!data.url) {
      throw new Error("Stripe did not return a checkout link.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error("Checkout error:", error);

    alert(
      error.message ||
      "Something went wrong while opening checkout. Please try again."
    );

    // Restore the button so the customer can retry
    stripeCheckoutBtn.disabled = false;
    stripeCheckoutBtn.textContent = originalButtonText;
  }
});

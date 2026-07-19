function updateCartCount() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

	   const total = cart.reduce(
	  (sum, item) => sum + (Number(item.quantity) || 0),
	  0
	);

    const badge = document.getElementById("cartCount");

    if (badge) {
        badge.textContent = total;
    }

}

updateCartCount();
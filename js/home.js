fetch("data/products.json")
  .then(response => response.json())
  .then(products => {
    const homeProducts = document.getElementById("homeProducts");

    homeProducts.innerHTML = "";

    Object.keys(products)
  .slice(0, 4)
  .forEach(productId => {
      const product = products[productId];

      const image = `images/${productId}/1.png`;

      homeProducts.innerHTML += `
        <div class="category-card"
     onclick="window.location.href='product.html?id=${productId}'">
          <img src="${image}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p class="price">${product.price}</p>

          <div class="shop-card-actions">
            <span class="view-product">
				View Product →
			</span>
            <button
    class="quick-add-btn"
    onclick="event.stopPropagation(); quickAddToCart('${productId}')">
              Add to Cart
            </button>
          </div>
        </div>
      `;
    });

        window.allProducts = products;
  })
  .catch(error => {
    console.error("Could not load products:", error);

    const homeProducts = document.getElementById("homeProducts");

    if (homeProducts) {
      homeProducts.innerHTML = `
        <p style="text-align:center;padding:40px;">
          Products could not be loaded.<br>
          Please refresh the page.
        </p>
      `;
    }
  });

function quickAddToCart(productId) {
  const product = window.allProducts[productId];

  const image = `images/${productId}/1.png`;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      title: product.title,
      price: product.price,
      image: image,
      quantity: 1
    });
  }

	localStorage.setItem("cart", JSON.stringify(cart));

	if (typeof updateCartCount === "function") {
	  updateCartCount();
	}

	const toast = document.getElementById("cartToast");

	if (toast) {
	  toast.classList.add("show");

	  setTimeout(() => {
		toast.classList.remove("show");
	  }, 3000);
	}
}
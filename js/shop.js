let allProducts = {};

fetch("data/products.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`Products request failed: ${response.status}`);
    }

    return response.json();
  })
  .then(products => {
    allProducts = products;
    window.allProducts = products;

    displayProducts(allProducts);
    setupFilters();
  })
  .catch(error => {
    console.error("Could not load products:", error);

    const shopGrid = document.getElementById("shopGrid");

    if (shopGrid) {
      shopGrid.innerHTML = `
        <p style="text-align:center;padding:40px;">
          Products could not be loaded.<br>
          Please refresh the page.
        </p>
      `;
    }
  });


function displayProducts(products) {
  const shopGrid = document.getElementById("shopGrid");

  shopGrid.innerHTML = "";

  Object.keys(products).forEach(productId => {
    const product = products[productId];

	const image = `images/${productId}/1.png`;

    shopGrid.innerHTML += `
      <div class="shop-card" onclick="goToProduct('${productId}')">
        <img src="${image}" alt="${product.title}">

        <h3>${product.title}</h3>

        <p class="price">${product.price}</p>

        <p>${product.category}</p>

        <div class="shop-card-actions">
          <span class="view-product">View Product →</span>

          <button
            class="quick-add-btn"
            onclick="event.stopPropagation(); quickAddToCart('${productId}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
}

function goToProduct(productId) {
  window.location.href = `product.html?id=${productId}`;
}

function setupFilters() {
  const filters = document.querySelectorAll(
    ".category-filter, .color-filter, .size-filter"
  );

  filters.forEach(filter => {
    filter.addEventListener("change", filterProducts);
  });

  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");

  priceRange.addEventListener("input", function () {
    priceValue.textContent = "$" + this.value;
    filterProducts();
  });

  document
    .getElementById("clearFiltersBtn")
    .addEventListener("click", clearFilters);
}

function filterProducts() {
  const selectedCategories = [
    ...document.querySelectorAll(".category-filter:checked")
  ].map(box => box.value);

  const selectedColors = [
    ...document.querySelectorAll(".color-filter:checked")
  ].map(box => box.value);

  const selectedSizes = [
    ...document.querySelectorAll(".size-filter:checked")
  ].map(box => box.value);

  const maxPrice = Number(document.getElementById("priceRange").value);

  const filteredProducts = {};

  Object.keys(allProducts).forEach(productId => {
    const product = allProducts[productId];

    const productColors = product.colors || [];
    const productSizes = product.sizes || [];
    const productPrice = Number(product.price.replace("$", ""));

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

    const colorMatch =
      selectedColors.length === 0 ||
      selectedColors.some(color => productColors.includes(color));

    const sizeMatch =
      selectedSizes.length === 0 ||
      selectedSizes.some(size => productSizes.includes(size));

    const priceMatch = productPrice <= maxPrice;

    if (categoryMatch && colorMatch && sizeMatch && priceMatch) {
      filteredProducts[productId] = product;
    }
  });

  displayProducts(filteredProducts);
}

function quickAddToCart(productId) {
  const product = allProducts[productId];

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

  alert("Added to cart");
}

function clearFilters() {
  document
    .querySelectorAll(".category-filter, .color-filter, .size-filter")
    .forEach(filter => {
      filter.checked = false;
    });

  document.getElementById("priceRange").value = 500;
  document.getElementById("priceValue").textContent = "$500";

  displayProducts(allProducts);
}

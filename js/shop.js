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
	
		// Apply category from URL
	const params = new URLSearchParams(window.location.search);
	const category = params.get("category");

	if (category) {
	  const checkbox = document.querySelector(
		`.category-filter[value="${category}"]`
	  );

	  if (checkbox) {
		checkbox.checked = true;
		filterProducts();
	  }
	}
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

	const productColours = product.colours || [];

	const productSizes = product.sizes && product.sizes.length > 0
	  ? product.sizes
	  : ["8oz", "10oz", "12oz", "14oz", "16oz"].filter(size =>
		  product.title.toLowerCase().includes(size.toLowerCase())
		);

	const productPrice = Number(product.price.replace("$", ""));

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

	const colorMatch =
	  selectedColors.length === 0 ||
	  selectedColors.some(color => productColours.includes(color));

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

  if (!product) {
    alert("Product could not be found.");
    return;
  }

  const hasColours =
    Array.isArray(product.colours) &&
    product.colours.length > 0;

  const hasSizes =
    Array.isArray(product.sizes) &&
    product.sizes.length > 0;

  // Products with variants must be opened first
  if (hasColours || hasSizes) {
    window.location.href = `product.html?id=${productId}`;
    return;
  }

  const image = `images/${productId}/1.png`;

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      productId: productId,
      title: product.title,
      price: product.price,
      image: image,
      size: null,
      colour: null,
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

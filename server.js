require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const products = require("./data/products.json");

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from the .env file.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static("."));

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        error: "Your cart is empty."
      });
    }

    const lineItems = cart.map((item) => {
      /*
       * Product-page cart items contain productId.
       * Quick-add items may currently contain only id.
       */
      let productId = item.productId || item.id;

      /*
       * A sized item may have an ID such as:
       * gloves1-16oz
       *
       * productId should normally prevent this being needed,
       * but this provides a fallback.
       */
      if (!products[productId] && typeof productId === "string") {
        productId = Object.keys(products).find(
          (id) => productId === id || productId.startsWith(`${id}-`)
        );
      }

      const product = products[productId];

      if (!product) {
        throw new Error(`Product not found: ${item.productId || item.id}`);
      }

      if (
        !product.stripePriceId ||
        !product.stripePriceId.startsWith("price_")
      ) {
        throw new Error(
          `A valid Stripe Price ID is missing for product: ${productId}`
        );
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new Error(`Invalid quantity for product: ${productId}`);
      }

      return {
        price: product.stripePriceId,
        quantity
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: lineItems,

      customer_creation: "always",

      phone_number_collection: {
        enabled: true
      },

      shipping_address_collection: {
        allowed_countries: ["AU"]
      },

      billing_address_collection: "auto",

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "aud"
            },
            display_name: "Free Australia-wide shipping"
          }
        }
      ],

      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout.html`
    });

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error("Checkout error:", error);

    res.status(500).json({
      error: error.message || "Checkout could not be started."
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on ${baseUrl}`);
});
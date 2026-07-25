require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const products = require("./data/products.json");

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from the .env file.");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is missing from the environment variables.");
}

if (!process.env.ORDER_EMAIL) {
  throw new Error("ORDER_EMAIL is missing from the environment variables.");
}

if (!process.env.ORDER_EMAIL_APP_PASSWORD) {
  throw new Error("ORDER_EMAIL_APP_PASSWORD is missing from the environment variables.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ORDER_EMAIL,
    pass: process.env.ORDER_EMAIL_APP_PASSWORD
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000
});

app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
	  const session = event.data.object;

	  const productsOrdered = Object.values(
		session.metadata || {}
	  ).join("\n");

	  const amountPaid =
		typeof session.amount_total === "number"
		  ? `$${(session.amount_total / 100).toFixed(2)} AUD`
		  : "Unknown";

	  console.log("Payment completed!");
	  console.log("Ordered products:", productsOrdered);

	  try {
		await emailTransporter.sendMail({
		  from: process.env.ORDER_EMAIL,
		  to: process.env.ORDER_EMAIL,
		  subject: `New Elevate Boxing order - ${amountPaid}`,
		  text: `
	New paid order received.

	Customer name:
	${session.customer_details?.name || "Not provided"}

	Customer email:
	${session.customer_details?.email || "Not provided"}

	Customer phone:
	${session.customer_details?.phone || "Not provided"}

	Amount paid:
	${amountPaid}

	Products:
	${productsOrdered || "No product information received"}

	Stripe session:
	${session.id}
		  `.trim()
		});

		console.log("Order email sent.");
	  } catch (error) {
		console.error("Order email failed:", error.message);
	  }
	}

    res.json({ received: true });
  }
);

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

    const orderMetadata = {};

	const lineItems = cart.map((item, index) => {
	  let productId = item.productId || item.id;

	  // Fallback for cart IDs containing size or colour
	  if (!products[productId] && typeof productId === "string") {
		productId = Object.keys(products).find(
		  id => productId === id || productId.startsWith(`${id}-`)
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

	  // Only accept colours that actually belong to this product
	  const colour =
		item.colour &&
		Array.isArray(product.colours) &&
		product.colours.includes(item.colour)
		  ? item.colour
		  : "Not selected";

	  // Only accept sizes that actually belong to this product
	  const size =
		item.size &&
		Array.isArray(product.sizes) &&
		product.sizes.includes(item.size)
		  ? item.size
		  : "Not selected";

	  // Save each ordered item in Stripe metadata
	  orderMetadata[`item_${index + 1}`] =
		`${product.title} | Size: ${size} | Colour: ${colour} | Qty: ${quantity}`;

	  return {
		price: product.stripePriceId,
		quantity
	  };
	});

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: lineItems,
	  
	  metadata: orderMetadata,

		payment_intent_data: {
		  metadata: orderMetadata
		},

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

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
  typescript: true,
});

export async function createPaymentLink(
  amount: number,
  currency: string,
  orderId: string,
  description: string
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: description,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderId}?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderId}?status=cancelled`,
    client_reference_id: orderId,
    metadata: {
      orderId,
    },
  });

  return session.url;
}

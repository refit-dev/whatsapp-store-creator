import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createPaymentLink(
  amount: number,
  currency: string,
  orderId: string,
  description: string
) {
  const response = await razorpay.paymentLink.create({
    amount,
    currency,
    description,
    reference_id: orderId,
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderId}`,
    callback_method: "get",
    customer: {
      name: "",
      email: "",
      contact: "",
    },
    options: {
      checkout: {
        name: "Store",
      },
    },
  });

  return (response as any).short_url;
}

export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(webhookBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

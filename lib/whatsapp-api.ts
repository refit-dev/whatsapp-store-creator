import { WhatsAppItem, WhatsAppBuyer } from "../utils/wa";

type WhatsAppMessageTemplate = {
  name: string;
  language: string;
  components?: {
    type: "body" | "header" | "button";
    parameters: any[];
  }[];
};

export class WhatsAppAPI {
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new Error("WhatsApp API credentials not configured");
    }

    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendOtp(to: string, code: string) {
    const templateName =
      process.env.WHATSAPP_OTP_TEMPLATE_NAME || "phone_verification_otp";
    const language = process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en";

    const template: WhatsAppMessageTemplate = {
      name: templateName,
      language,
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: code }],
        },
      ],
    };

    return this.sendRequest("messages", {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    });
  }

  private async sendRequest(endpoint: string, data: any) {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${this.phoneNumberId}/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async sendOrderConfirmation(
    to: string,
    items: WhatsAppItem[],
    buyer: WhatsAppBuyer,
    paymentLink?: string
  ) {
    const template: WhatsAppMessageTemplate = {
      name: "order_confirmation",
      language: "en",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: buyer.name },
            {
              type: "text",
              text: items
                .map(
                  (item) => `${item.title} ×${item.qty} — ${item.priceCents}`
                )
                .join("\\n"),
            },
            {
              type: "text",
              text: paymentLink || "Cash on delivery",
            },
          ],
        },
      ],
    };

    return this.sendRequest("messages", {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    });
  }

  async sendOrderStatus(
    to: string,
    orderId: string,
    status: "confirmed" | "processing" | "shipped" | "delivered"
  ) {
    const template: WhatsAppMessageTemplate = {
      name: "order_status_update",
      language: "en",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: orderId },
            { type: "text", text: status },
          ],
        },
      ],
    };

    return this.sendRequest("messages", {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template,
    });
  }
}

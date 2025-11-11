import twilio from "twilio";

export class TwilioSMS {
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables."
      );
    }

    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  /**
   * Send an OTP code via SMS
   * @param to - The recipient's phone number in E.164 format (e.g., +1234567890)
   * @param code - The 6-digit OTP code
   * @returns Promise with the message SID
   */
  async sendOtp(to: string, code: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        body: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`,
        from: this.fromNumber,
        to: to,
      });

      return message.sid;
    } catch (error: any) {
      console.error("Twilio SMS Error:", error);
      throw new Error(
        `Failed to send SMS: ${error.message || "Unknown error"}`
      );
    }
  }

  /**
   * Verify if the provided phone number is valid
   * @param phoneNumber - The phone number to validate
   * @returns boolean indicating if the number is valid
   */
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      // Basic E.164 format validation
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      return e164Regex.test(phoneNumber);
    } catch (error) {
      console.error("Phone validation error:", error);
      return false;
    }
  }

  /**
   * Send order notification via SMS
   * @param to - The recipient's phone number
   * @param orderId - The order ID
   * @param items - Order items summary
   * @returns Promise with the message SID
   */
  async sendOrderNotification(
    to: string,
    orderId: string,
    items: string
  ): Promise<string> {
    try {
      const message = await this.client.messages.create({
        body: `Order Confirmation #${orderId}\n\nItems:\n${items}\n\nThank you for your order!`,
        from: this.fromNumber,
        to: to,
      });

      return message.sid;
    } catch (error: any) {
      console.error("Twilio SMS Error:", error);
      throw new Error(
        `Failed to send order notification: ${error.message || "Unknown error"}`
      );
    }
  }
}

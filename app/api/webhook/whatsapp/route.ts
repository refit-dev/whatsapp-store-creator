import { NextRequest, NextResponse } from "next/server";
import { WhatsAppAPI } from "@/lib/whatsapp-api";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify webhook
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Process message
    const entries = body.entry;
    for (const entry of entries) {
      const changes = entry.changes;
      for (const change of changes) {
        if (change.field === "messages") {
          const messages = change.value.messages;
          for (const message of messages) {
            // Handle message
            console.log("Received message:", message);

            // Example: Echo back the message
            if (message.type === "text") {
              const whatsapp = new WhatsAppAPI();
              await whatsapp.sendOrderStatus(
                message.from,
                "TEST-123",
                "confirmed"
              );
            }
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

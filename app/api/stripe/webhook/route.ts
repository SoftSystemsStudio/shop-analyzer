import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") as string;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Error verifying Stripe signature:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  // ✅ Handle event types here
  switch (event.type) {
    case "checkout.session.completed":
      console.log("✅ Checkout session completed:", event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

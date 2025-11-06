import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI!;

export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const code = searchParams.get("code");
const shop = searchParams.get("shop");
const state = searchParams.get("state");

if (!code || !shop) {
return NextResponse.json({ error: "Missing code or shop" }, { status: 400 });
}

// Exchange code for access token
const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
client_id: SHOPIFY_API_KEY,
client_secret: SHOPIFY_API_SECRET,
code,
}),
});

const tokenData = await tokenRes.json();

if (!tokenData.access_token) {
return NextResponse.json({ error: "Failed to get access token" }, { status: 400 });
}

// You now have the access token for the store
// TODO: store it in database or session for later use
return NextResponse.json({
message: "Shopify store connected successfully",
shop,
access_token: tokenData.access_token,
});
}

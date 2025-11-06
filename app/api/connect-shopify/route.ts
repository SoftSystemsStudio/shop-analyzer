import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES!;
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI!;

export async function GET(req: NextRequest) {
const { searchParams } = new URL(req.url);
const shop = searchParams.get("shop");

if (!shop) {
return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
}

const state = Math.random().toString(36).substring(2, 15); // simple CSRF token
const redirectUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(SHOPIFY_REDIRECT_URI)}&state=${state}&grant_options[]=per-user`;

// Optional: store state in cookie/session if validating later
return NextResponse.redirect(redirectUrl);
}

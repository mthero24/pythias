import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import axios from "axios";
import { ApiKeyIntegrations, Sale, ShopifyProducts } from "@pythias/mongo";

const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL || "https://shopapp.pythiastechnologies.com";

// ── helpers ───────────────────────────────────────────────────────────────────

function shopName(displayName) {
  return displayName.replace(/^shopify-/, "");
}

async function getConnections() {
  return ApiKeyIntegrations.find({ displayName: /^shopify-/ }).lean();
}

async function getConn(shop) {
  return ApiKeyIntegrations.findOne({ displayName: `shopify-${shop}` }).lean();
}

function shopifyHeaders(conn) {
  return { Authorization: `Bearer ${conn.apiKey}` };
}

// ── GET /api/admin/shopify  ── list connections + summary ─────────────────────

export async function handleShopifyAdminGET(req) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const connections = await getConnections();
  const now = new Date();

  const shops = await Promise.all(
    connections.map(async (conn) => {
      const shop = shopName(conn.displayName);
      const [activeSales, totalProducts] = await Promise.all([
        Sale.countDocuments({ shop, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }),
        ShopifyProducts.countDocuments({ shop }),
      ]);
      return { shop, displayName: conn.displayName, activeSales, totalProducts, _id: conn._id };
    })
  );

  return NextResponse.json({ error: false, shops });
}

// ── GET /api/admin/shopify/sales?shop=  ─── list sales ───────────────────────

export async function handleShopifySalesGET(req) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");

  const query = shop ? { shop } : { shop: { $in: (await getConnections()).map(c => shopName(c.displayName)) } };
  const sales = await Sale.find(query).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ error: false, sales });
}

// ── POST /api/admin/shopify/sales ─── create sale ────────────────────────────

export async function handleShopifySalesPOST(req) {
  const jwtToken = await getToken({ req });
  if (!jwtToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shop, ...saleData } = body;

  if (!shop) return NextResponse.json({ error: true, msg: "shop is required" }, { status: 400 });

  const conn = await ApiKeyIntegrations.findOne({ displayName: `shopify-${shop}` }).lean();
  if (!conn) return NextResponse.json({ error: true, msg: "Shop not connected" }, { status: 404 });

  const sale = new Sale({
    shop,
    name: saleData.name,
    discountType: saleData.discountType || "percent",
    discountValue: Number(saleData.discountValue),
    startDate: new Date(saleData.startDate),
    endDate: new Date(saleData.endDate),
    scope: saleData.scope || "site",
    newShopifyProductsOnly: !!saleData.newShopifyProductsOnly,
    couponCode: saleData.couponCode?.trim().toUpperCase() || null,
    blankCode: saleData.blankCode || null,
    blankName: saleData.blankName || null,
    colorNames: saleData.colorNames || [],
    sizeNames: saleData.sizeNames || [],
    designSku: saleData.designSku || null,
    designName: saleData.designName || null,
    isActive: true,
  });
  await sale.save();

  // Fire-and-forget: notify pythias-app to apply this sale to Shopify prices
  axios.post(
    `${SHOPIFY_APP_URL}/webhooks/sales`,
    { shop, saleId: sale._id.toString(), action: "apply", connection: { apiKey: conn.apiKey } },
    { headers: { "Content-Type": "application/json" } }
  ).catch(e => console.error("[shopifySales] apply error:", e.message));

  return NextResponse.json({ error: false, sale });
}

// ── DELETE /api/admin/shopify/sales ─── delete sale ──────────────────────────

export async function handleShopifySalesDELETE(req) {
  const jwtToken = await getToken({ req });
  if (!jwtToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { saleId } = body;

  const sale = await Sale.findById(saleId);
  if (!sale) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });

  const conn = await ApiKeyIntegrations.findOne({ displayName: `shopify-${sale.shop}` }).lean();

  // Fire-and-forget: notify pythias-app to revert prices
  if (conn) {
    axios.post(
      `${SHOPIFY_APP_URL}/webhooks/sales`,
      { shop: sale.shop, saleId: sale._id.toString(), action: "remove", connection: { apiKey: conn.apiKey } },
      { headers: { "Content-Type": "application/json" } }
    ).catch(e => console.error("[shopifySales] remove error:", e.message));
  }

  await sale.deleteOne();
  return NextResponse.json({ error: false, deletedId: saleId });
}

// ── GET /api/admin/shopify/products?shop=&page_info= ─── proxied via pythias-app

export async function handleShopifyAdminProductsGET(req) {
  const jwtToken = await getToken({ req });
  if (!jwtToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shop      = searchParams.get("shop");
  const limit     = Math.min(Number(searchParams.get("limit") || 50), 250);
  const page_info = searchParams.get("page_info") || null;

  if (!shop) return NextResponse.json({ error: true, msg: "shop is required" }, { status: 400 });

  const conn = await getConn(shop);
  if (!conn) return NextResponse.json({ error: true, msg: "Shop not connected" }, { status: 404 });

  const params = new URLSearchParams({ shop, limit });
  if (page_info) params.set("page_info", page_info);

  let errorRes;
  const res = await axios.get(
    `${SHOPIFY_APP_URL}/api/products?${params}`,
    { headers: shopifyHeaders(conn) }
  ).catch(e => { errorRes = e.response?.data ?? e.message; });

  if (errorRes) return NextResponse.json({ error: true, msg: errorRes }, { status: 502 });

  return NextResponse.json(res.data);
}

// ── GET /api/admin/shopify/orders?shop=&status=&page_info= ── proxied via pythias-app

export async function handleShopifyOrdersGET(req) {
  const jwtToken = await getToken({ req });
  if (!jwtToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const shop      = searchParams.get("shop");
  const status    = searchParams.get("status") || "open";
  const limit     = Math.min(Number(searchParams.get("limit") || 50), 250);
  const page_info = searchParams.get("page_info") || null;

  if (!shop) return NextResponse.json({ error: true, msg: "shop is required" }, { status: 400 });

  const conn = await getConn(shop);
  if (!conn) return NextResponse.json({ error: true, msg: "Shop not connected" }, { status: 404 });

  const params = new URLSearchParams({ shop, status, limit });
  if (page_info) params.set("page_info", page_info);

  let errorRes;
  const res = await axios.get(
    `${SHOPIFY_APP_URL}/api/orders?${params}`,
    { headers: shopifyHeaders(conn) }
  ).catch(e => { errorRes = e.response?.data ?? e.message; });

  if (errorRes) return NextResponse.json({ error: true, msg: errorRes }, { status: 502 });

  return NextResponse.json(res.data);
}

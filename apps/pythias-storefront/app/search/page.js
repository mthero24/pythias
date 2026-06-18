import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Search now lives on /products (browse + search unified). Redirect old /search links, preserving ?q=.
export default async function SearchPage({ searchParams }) {
    const sp = await searchParams;
    const q = (sp?.q || "").trim();
    redirect(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
}

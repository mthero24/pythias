import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumThread } from "@/models/Forum";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

const CATEGORIES = {
    "production-tips":          { label: "Production Tips & Equipment", icon: "🖨️", description: "Printer settings, technique sharing, equipment advice, and how-to's from operators who've figured it out." },
    "business-sales":           { label: "Business & Sales",            icon: "📈", description: "Pricing strategy, marketplace tips, finding customers, and growing your revenue." },
    "problems-troubleshooting": { label: "Problems & Troubleshooting",  icon: "🔧", description: "Something's broken or not working right. Post it here — someone in the community has probably solved it." },
    "wins-announcements":       { label: "Wins, Announcements & General", icon: "🎉", description: "New equipment, big orders, milestones, life updates. This is where we celebrate and connect." },
};

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)   return "just now";
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export async function generateMetadata({ params }) {
    const { category } = await params;
    const cat = CATEGORIES[category];
    if (!cat) return {};
    return {
        title: `${cat.label} — Pythias Community`,
        description: cat.description,
    };
}

export default async function CategoryPage({ params, searchParams }) {
    const { category } = await params;
    const cat = CATEGORIES[category];
    if (!cat) notFound();

    const sp    = await searchParams;
    const page  = Math.max(1, parseInt(sp?.page || "1"));
    const PAGE_SIZE = 20;

    const [threads, total] = await Promise.all([
        ForumThread.find({ category })
            .sort({ pinned: -1, lastActivityAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .select("title authorName replyCount views lastActivityAt pinned locked createdAt")
            .lean(),
        ForumThread.countDocuments({ category }),
    ]);

    const pages = Math.ceil(total / PAGE_SIZE);

    return (
        <main style={{ background: "#0f172a", minHeight: "100vh" }}>
            {/* Header */}
            <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 36px" }}>
                <div style={{ maxWidth: 860, margin: "0 auto" }}>
                    <Link href="/community" style={{ fontSize: "0.8rem", color: "#D3A73D", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
                        ← Back to Community
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <span style={{ fontSize: "2.2rem" }}>{cat.icon}</span>
                            <div>
                                <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", margin: 0 }}>{cat.label}</h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", margin: "4px 0 0" }}>{cat.description}</p>
                            </div>
                        </div>
                        <Link href={`/community/new-thread?category=${category}`} style={{
                            background: "#D3A73D", color: "#0f172a", fontWeight: 700,
                            fontSize: "0.875rem", padding: "11px 22px", borderRadius: 9,
                            textDecoration: "none", whiteSpace: "nowrap",
                        }}>
                            + New Thread
                        </Link>
                    </div>
                </div>
            </section>

            {/* Thread list */}
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
                {threads.length === 0 && (
                    <div style={{ textAlign: "center", padding: "64px 0" }}>
                        <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>No threads yet — start the conversation.</p>
                        <Link href={`/community/new-thread?category=${category}`} style={{
                            background: "#D3A73D", color: "#0f172a", fontWeight: 700,
                            fontSize: "0.875rem", padding: "12px 24px", borderRadius: 9, textDecoration: "none",
                        }}>
                            Start the First Thread
                        </Link>
                    </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {serialize(threads).map(t => (
                        <Link key={t._id} href={`/community/${category}/${t._id}`} style={{ textDecoration: "none" }}>
                            <div style={{
                                padding: "18px 20px", borderRadius: 12,
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                                display: "grid", gridTemplateColumns: "1fr auto", gap: "8px 24px", alignItems: "center",
                            }}>
                                <div>
                                    <p style={{ fontWeight: 600, color: "#fff", fontSize: "0.975rem", margin: "0 0 6px", lineHeight: 1.4 }}>
                                        {t.pinned && <span style={{ color: "#D3A73D", marginRight: 6 }}>📌</span>}
                                        {t.locked && <span style={{ marginRight: 6 }}>🔒</span>}
                                        {t.title}
                                    </p>
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
                                        by {t.authorName} · {timeAgo(t.createdAt)}
                                    </span>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ color: "#D3A73D", fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{t.replyCount}</p>
                                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", margin: 0 }}>replies</p>
                                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", margin: "4px 0 0" }}>{t.views} views</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {pages > 1 && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32 }}>
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <Link key={p} href={`/community/${category}?page=${p}`} style={{
                                padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem",
                                textDecoration: "none",
                                background: p === page ? "#D3A73D" : "rgba(255,255,255,0.06)",
                                color: p === page ? "#0f172a" : "rgba(255,255,255,0.5)",
                            }}>
                                {p}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

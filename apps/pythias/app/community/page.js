import Link from "next/link";
import { ForumThread } from "@/models/Forum";
import { serialize } from "@/functions/serialize";
export const dynamic = "force-dynamic";

export const metadata = {
    title: "Community Forum — Pythias Technologies",
    description: "A community of print shop owners helping each other grow. Share tips, solve problems, celebrate wins, and connect with fellow operators in the Pythias network.",
    alternates: { canonical: "https://pythiastechnologies.com/community" },
};

const CATEGORIES = [
    { slug: "production-tips",           label: "Production Tips & Equipment", icon: "🖨️", description: "Printer settings, technique sharing, equipment advice, and how-to's from operators who've figured it out." },
    { slug: "business-sales",            label: "Business & Sales",            icon: "📈", description: "Pricing strategy, marketplace tips, finding customers, and growing your revenue." },
    { slug: "problems-troubleshooting",  label: "Problems & Troubleshooting",  icon: "🔧", description: "Something's broken or not working right. Post it here — someone in the community has probably solved it." },
    { slug: "wins-announcements",        label: "Wins, Announcements & General", icon: "🎉", description: "New equipment, big orders, milestones, life updates. This is where we celebrate and connect." },
];

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)  return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export default async function CommunityPage() {
    const recentThreads = await ForumThread.find({})
        .sort({ lastActivityAt: -1 })
        .limit(5)
        .select("title category authorName replyCount views lastActivityAt pinned")
        .lean();

    const categoryCounts = await ForumThread.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(categoryCounts.map(c => [c._id, c.count]));

    return (
        <main style={{ background: "#0f172a", minHeight: "100vh" }}>
            <style dangerouslySetInnerHTML={{ __html: ".community-cat-card:hover{border-color:rgba(211,167,61,0.3) !important;}" }} />
            {/* Hero */}
            <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "72px 24px 56px" }}>
                <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", marginBottom: 12 }}>
                        The Pythias Community
                    </p>
                    <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16 }}>
                        Built by print shops,<br />for print shops.
                    </h1>
                    <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 32px" }}>
                        Ask questions, share wins, vent frustrations, and learn from operators who are in the trenches just like you.
                    </p>
                    <Link href="/community/new-thread" style={{
                        display: "inline-block", background: "#D3A73D", color: "#0f172a",
                        fontWeight: 700, fontSize: "0.9rem", padding: "13px 28px",
                        borderRadius: 10, textDecoration: "none",
                    }}>
                        + Start a Discussion
                    </Link>
                </div>
            </section>

            {/* A note from the founder */}
            <section style={{ padding: "8px 24px 0" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", background: "rgba(211,167,61,0.06)", border: "1px solid rgba(211,167,61,0.18)", borderRadius: 16, padding: "28px 32px" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", margin: "0 0 12px" }}>A note from our founder</p>
                    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", lineHeight: 1.8, margin: "0 0 14px" }}>
                        I&apos;ve spent my career building the software behind print shops — and I&apos;ve seen up close how hard this business really is. Thin margins, marketplaces that move the goalposts, a machine that goes down on your biggest day, and platforms that can pull the rug out overnight.
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", lineHeight: 1.8, margin: "0 0 18px" }}>
                        This is the room I wish I&apos;d had back then — operators helping operators, no gatekeeping. Ask the question you think is dumb. Share the win. Vent the frustration. And when you finally crack a problem that cost you three days, post it so it costs the next person three minutes. We&apos;re all building something that lasts here, one shop at a time. Glad you&apos;re in it.
                    </p>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>— Michael</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: "2px 0 0" }}>Founder, Pythias Technologies</p>
                </div>
            </section>

            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 40, alignItems: "start" }}>

                {/* Categories */}
                <section>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Categories</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {CATEGORIES.map(cat => (
                            <Link key={cat.slug} href={`/community/${cat.slug}`} style={{ textDecoration: "none" }}>
                                <div className="community-cat-card" style={{
                                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: 14, padding: "20px 24px",
                                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "0 16px", alignItems: "center",
                                    transition: "border-color 0.15s",
                                }}
                                >
                                    <div style={{ fontSize: "1.8rem", lineHeight: 1 }}>{cat.icon}</div>
                                    <div>
                                        <p style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", marginBottom: 4 }}>{cat.label}</p>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>{cat.description}</p>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <p style={{ fontWeight: 700, color: "#D3A73D", fontSize: "1.1rem", margin: 0 }}>{countMap[cat.slug] ?? 0}</p>
                                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: 0 }}>threads</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent activity */}
                <aside>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>Recent Discussions</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {recentThreads.length === 0 && (
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>No discussions yet — be the first to post!</p>
                        )}
                        {serialize(recentThreads).map(t => {
                            const cat = CATEGORIES.find(c => c.slug === t.category);
                            return (
                                <Link key={t._id} href={`/community/${t.category}/${t._id}`} style={{ textDecoration: "none" }}>
                                    <div style={{
                                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                                        borderRadius: 10, padding: "14px 16px",
                                    }}>
                                        <p style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem", marginBottom: 6, lineHeight: 1.4 }}>
                                            {t.pinned && <span style={{ color: "#D3A73D", marginRight: 6 }}>📌</span>}
                                            {t.title}
                                        </p>
                                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#D3A73D", background: "rgba(211,167,61,0.1)", padding: "2px 8px", borderRadius: 20 }}>{cat?.label}</span>
                                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>by {t.authorName}</span>
                                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{timeAgo(t.lastActivityAt)}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </main>
    );
}

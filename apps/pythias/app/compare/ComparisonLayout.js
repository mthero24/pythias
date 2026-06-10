import Link from "next/link";
import s from "./compare.module.css";

// ── VS page layout ────────────────────────────────────────────────────────
export function VsLayout({ hero, overview, table, differences, decide, faqs }) {
    return (
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow} />
                <div className={s.wrap}>
                    <span className={s.badge}>{hero.badge}</span>
                    <h1 className={s.h1}>{hero.h1}</h1>
                    <p className={s.sub}>{hero.sub}</p>
                    <div className={s.verdict}>
                        <span className={s.verdictLabel}>Our verdict:</span>
                        <span>{hero.verdict}</span>
                    </div>
                </div>
            </section>

            {/* Overview */}
            <section className={s.overviewSection}>
                <div className={s.wrap}>
                    <div className={s.overviewGrid}>
                        <div className={`${s.overviewCard} ${s.overviewCardWinner}`}>
                            <p className={s.overviewName}>Pythias Technologies</p>
                            <p className={s.overviewTitle}>{overview.pythias.tagline}</p>
                            <p className={s.overviewDesc}>{overview.pythias.desc}</p>
                            <p className={s.overviewPrice}>Starting at {overview.pythias.price}</p>
                        </div>
                        <div className={s.vsCircle}>VS</div>
                        <div className={s.overviewCard}>
                            <p className={s.overviewNameAlt}>{overview.competitor.name}</p>
                            <p className={s.overviewTitle}>{overview.competitor.tagline}</p>
                            <p className={s.overviewDesc}>{overview.competitor.desc}</p>
                            <p className={s.overviewPrice}>Starting at {overview.competitor.price}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison table */}
            <section className={s.tableSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>Feature Comparison</p>
                        <h2 className={s.h2}>Side-by-side breakdown</h2>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={s.compTable}>
                            <thead>
                                <tr>
                                    <th className={s.thFeature}>Feature</th>
                                    <th className={s.thPythias}>Pythias</th>
                                    <th className={s.thComp}>{overview.competitor.name}</th>
                                    <th className={s.thWinner}>Winner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table.map((row) => (
                                    <tr key={row.feature}>
                                        <td className={s.tdFeature}>{row.feature}</td>
                                        <td>
                                            {row.pythias === true  ? <span className={s.yes}>✓ Yes</span>
                                           : row.pythias === false ? <span className={s.no}>✗ No</span>
                                           : <span className={s.partial}>{row.pythias}</span>}
                                        </td>
                                        <td>
                                            {row.competitor === true  ? <span className={s.yes}>✓ Yes</span>
                                           : row.competitor === false ? <span className={s.no}>✗ No</span>
                                           : <span className={s.partial}>{row.competitor}</span>}
                                        </td>
                                        <td className={s.tdWinner}>
                                            {row.winner === "pythias" ? <span className={s.winnerBadge}>Pythias</span>
                                           : row.winner === "tie"     ? <span className={s.winnerBadgeTie}>Tie</span>
                                           : <span className={s.winnerBadgeTie}>{overview.competitor.name}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Key differences */}
            <section className={s.diffSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>Why It Matters</p>
                        <h2 className={s.h2}>Key differences</h2>
                    </div>
                    <div className={s.diffGrid}>
                        {differences.map((d) => (
                            <div key={d.title} className={s.diffCard}>
                                <span className={s.diffIcon}>{d.icon}</span>
                                <h3 className={s.diffTitle}>{d.title}</h3>
                                <p className={s.diffBody}>{d.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Decision guide */}
            <section className={s.decideSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>Decision Guide</p>
                        <h2 className={s.h2}>Which one is right for you?</h2>
                    </div>
                    <div className={s.decideGrid}>
                        <div className={`${s.decideCard} ${s.decideCardGold}`}>
                            <p className={s.decideLabel}>Choose Pythias if…</p>
                            <p className={s.decideTitle}>{decide.pythias.title}</p>
                            <p className={s.decideSub}>{decide.pythias.sub}</p>
                            <ul className={s.decideList}>
                                {decide.pythias.points.map((pt) => (
                                    <li key={pt} className={s.decideItem}>
                                        <span className={s.decideCheck}>✓</span>{pt}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/#calendar-booking-section" className={s.decideBtnGold}>Book a Free Demo →</Link>
                        </div>
                        <div className={`${s.decideCard} ${s.decideCardGray}`}>
                            <p className={s.decideLabelGray}>Consider {overview.competitor.name} if…</p>
                            <p className={s.decideTitle}>{decide.competitor.title}</p>
                            <p className={s.decideSub}>{decide.competitor.sub}</p>
                            <ul className={s.decideList}>
                                {decide.competitor.points.map((pt) => (
                                    <li key={pt} className={s.decideItem}>
                                        <span className={s.decideCheckGray}>→</span>{pt}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/pricing" className={s.decideBtnGhost}>Compare Pricing →</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={s.faqSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <h2 className={s.h2}>Frequently asked questions</h2>
                    </div>
                    <div className={s.faqList}>
                        {faqs.map((f) => (
                            <div key={f.q} className={s.faqItem}>
                                <p className={s.faqQ}>{f.q}</p>
                                <p className={s.faqA}>{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrap}>
                    <h2 className={s.ctaTitle}>See Pythias in action</h2>
                    <p className={s.ctaSub}>Book a free 30-minute demo and we'll walk through your exact workflow.</p>
                    <div className={s.ctaBtns}>
                        <Link href="/#calendar-booking-section" className={s.ctaGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.ctaGhost}>See Pricing →</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

// ── Best-of page layout ───────────────────────────────────────────────────
export function BestOfLayout({ hero, intro, tools, faqs }) {
    return (
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow} />
                <div className={s.wrap}>
                    <span className={s.badge}>{hero.badge}</span>
                    <h1 className={s.h1}>{hero.h1}</h1>
                    <p className={s.sub}>{hero.sub}</p>
                </div>
            </section>

            {/* Intro */}
            {intro && (
                <section style={{ background: "#fff", padding: "48px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div className={s.wrap}>
                        <p style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.8, maxWidth: 760 }}>{intro}</p>
                    </div>
                </section>
            )}

            {/* Ranked list */}
            <section className={s.rankSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>2026 Rankings</p>
                        <h2 className={s.h2}>The best tools, ranked</h2>
                        <p className={s.sectionSub}>Evaluated on features, pricing, ease of use, and fit for print-on-demand operations.</p>
                    </div>
                    <div className={s.rankList}>
                        {tools.map((tool, i) => (
                            <div key={tool.name} className={`${s.rankCard} ${i === 0 ? s.rankCardTop : ""}`}>
                                <div className={`${s.rankNum} ${i === 0 ? s.rankNumTop : ""}`}>#{i + 1}</div>
                                <div className={s.rankBody}>
                                    <p className={s.rankName}>
                                        {tool.name}
                                        {i === 0 && <span className={s.rankTopBadge}>Our Pick</span>}
                                    </p>
                                    <p className={s.rankTagline}>{tool.tagline}</p>
                                    <p className={s.rankDesc}>{tool.desc}</p>
                                    <ul className={s.rankPros}>
                                        {tool.pros.map((p) => (
                                            <li key={p} className={s.rankPro}><span className={s.rankProCheck}>✓</span>{p}</li>
                                        ))}
                                        {tool.cons?.map((c) => (
                                            <li key={c} className={s.rankCon}><span className={s.rankConX}>✗</span>{c}</li>
                                        ))}
                                    </ul>
                                    <p className={s.rankPrice}>{tool.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={s.faqSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <h2 className={s.h2}>Frequently asked questions</h2>
                    </div>
                    <div className={s.faqList}>
                        {faqs.map((f) => (
                            <div key={f.q} className={s.faqItem}>
                                <p className={s.faqQ}>{f.q}</p>
                                <p className={s.faqA}>{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrap}>
                    <h2 className={s.ctaTitle}>Ready to see the best in action?</h2>
                    <p className={s.ctaSub}>Book a free 30-minute Pythias demo and we'll walk through your exact workflow.</p>
                    <div className={s.ctaBtns}>
                        <Link href="/#calendar-booking-section" className={s.ctaGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.ctaGhost}>See Pricing →</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

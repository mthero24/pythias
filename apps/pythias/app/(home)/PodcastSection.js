import s from "./home.module.css";

export default function PodcastSection() {
    return (
        <section className={s.podcastSection}>
            <div className={s.wrap}>
                <div className={s.podcastInner}>
                    {/* Text side */}
                    <div className={s.podcastText}>
                        <p className={s.podcastTag}>Featured Podcast</p>
                        <h2 className={s.podcastH2}>
                            Hear how we&apos;re changing<br />print-on-demand fulfillment.
                        </h2>
                        <p className={s.podcastSub}>
                            We sat down to talk about the chaos inside most print shops,
                            why existing software falls short, and how Pythias was built
                            to fix it — from the production floor up.
                        </p>
                        <div className={s.podcastMeta}>
                            <span className={s.podcastDot} />
                            <span className={s.podcastMetaText}>Pythias Technologies · Founder Interview</span>
                        </div>
                    </div>

                    {/* Embed side */}
                    <div className={s.podcastEmbed}>
                        <div className={s.podcastFrame}>
                            <iframe
                                src="https://www.youtube.com/embed/gNssMTukPQk?rel=0&modestbranding=1"
                                title="Pythias Technologies Podcast Interview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

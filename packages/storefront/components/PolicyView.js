// Presentational renderer for a policy/legal page. Body is plain text with light markdown:
// blank-line-separated paragraphs, "## " or "# " headings, and "- "/"* " bullet lists.
function renderBlocks(body) {
    const blocks = String(body || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    return blocks.map((b, i) => {
        if (/^#{1,3}\s/.test(b)) {
            return <h2 key={i} style={{ fontSize: "1.25rem", margin: "30px 0 10px", fontWeight: 700 }}>{b.replace(/^#{1,3}\s/, "")}</h2>;
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
            return <ul key={i} style={{ margin: "0 0 16px", paddingLeft: 22, lineHeight: 1.7 }}>{lines.map((l, j) => <li key={j}>{l.trim().replace(/^[-*]\s/, "")}</li>)}</ul>;
        }
        return <p key={i} style={{ lineHeight: 1.7, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>{b}</p>;
    });
}

export default function PolicyView({ title, body, updatedAt }) {
    return (
        <section style={{ padding: "56px 0" }}>
            <div className="sf-container" style={{ maxWidth: 760 }}>
                <h1 style={{ fontSize: "2rem", margin: "0 0 8px" }}>{title}</h1>
                {updatedAt && <p style={{ fontSize: "0.82rem", opacity: 0.6, margin: "0 0 24px" }}>Last updated {updatedAt}</p>}
                {!updatedAt && <div style={{ height: 20 }} />}
                {body?.trim() ? renderBlocks(body) : <p style={{ opacity: 0.6 }}>This policy hasn’t been written yet.</p>}
            </div>
        </section>
    );
}

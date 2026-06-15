// Rich text / content block. `body` is plain text (rendered with line breaks).
export default function RichText({ settings = {} }) {
    const { heading, body, align = "left" } = settings;
    return (
        <section style={{ padding: "56px 0", textAlign: align }}>
            <div className="sf-container" style={{ maxWidth: 760 }}>
                {heading && <h2 style={{ fontSize: "1.9rem", margin: "0 0 16px" }}>{heading}</h2>}
                {body && (
                    <div style={{ fontSize: "1.05rem", lineHeight: 1.7, whiteSpace: "pre-wrap", opacity: 0.9 }}>
                        {body}
                    </div>
                )}
            </div>
        </section>
    );
}

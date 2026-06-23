// React Email shell for storefront emails. Rendered to HTML by lib/email.js via
// renderToStaticMarkup (sync) — @react-email/components give table-based, email-client-safe
// markup (Outlook included). Content/footer are passed as pre-built HTML strings (from emailFlows
// etc.) and injected, so existing email bodies keep working unchanged.
import { Html, Head, Body, Container, Section, Heading, Img } from "@react-email/components";

const s = {
    body: { backgroundColor: "#f5f5f5", fontFamily: "Arial, Helvetica, sans-serif", color: "#111111", margin: 0, padding: 0 },
    container: { maxWidth: "560px", margin: "0 auto", padding: "24px" },
    card: { backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", border: "1px solid #eeeeee" },
    header: { padding: "20px 24px", borderBottom: "1px solid #f0f0f0", fontWeight: 800, fontSize: "18px" },
    content: { padding: "24px", fontSize: "15px", lineHeight: "1.6" },
    title: { margin: "0 0 12px", fontSize: "20px", fontWeight: 700, lineHeight: "1.3" },
    footer: { textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "16px 8px", lineHeight: "1.6" },
};

export function EmailShell({ brand = "Our Store", title = "", contentHtml = "", footerHtml = "", logo = "", logoHeight = 40 }) {
    return (
        <Html lang="en">
            <Head />
            <Body style={s.body}>
                <Container style={s.container}>
                    <Section style={s.card}>
                        <Section style={s.header}>
                            {logo
                                ? <Img src={logo} alt={brand} height={logoHeight} style={{ maxHeight: `${logoHeight}px`, width: "auto", display: "block" }} />
                                : brand}
                        </Section>
                        <Section style={s.content}>
                            {title ? <Heading as="h1" style={s.title}>{title}</Heading> : null}
                            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                        </Section>
                    </Section>
                    {footerHtml ? (
                        <Section style={s.footer}>
                            <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
                        </Section>
                    ) : null}
                </Container>
            </Body>
        </Html>
    );
}

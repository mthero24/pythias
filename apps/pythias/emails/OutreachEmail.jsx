// Plain, personal cold-outreach email — looks like Michael typed it in his own client:
// left-aligned, system font, no big header/branding, a single inline text link.
// CAN-SPAM compliant: every send gets an unsubscribe link + physical mailing address footer.
//
// Rendered to HTML by lib/outreachMailer.js via @react-email/render. The body copy comes from
// the shared sequence (@pythias/mongo → OUTREACH_SEQUENCE) with {{tokens}} already filled.
import { Html, Head, Body, Container, Section, Text, Link, Hr } from "@react-email/components";

const MAILING_ADDRESS =
    process.env.OUTREACH_MAILING_ADDRESS ||
    "Pythias Technologies · 1421 Hidden View Drive, Lapeer, MI 48446";

const s = {
    body: {
        backgroundColor: "#ffffff",
        margin: 0,
        padding: 0,
        // System font stack — reads like a normal personal email, not a marketing template.
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: "#222222",
    },
    container: { maxWidth: "560px", margin: "0 auto", padding: "16px 0" },
    p: { fontSize: "15px", lineHeight: "1.55", color: "#222222", margin: "0 0 14px", textAlign: "left", whiteSpace: "pre-wrap" },
    link: { color: "#1a56db", textDecoration: "underline" },
    hr: { borderColor: "#eeeeee", margin: "22px 0 12px" },
    footer: { fontSize: "11px", lineHeight: "1.5", color: "#999999", margin: "0 0 6px", textAlign: "left" },
    footerLink: { color: "#999999", textDecoration: "underline" },
};

// `body` is the already-token-filled plain-text body (paragraphs separated by blank lines).
// `unsub` is the absolute unsubscribe URL. `mailingAddress` overrides the env default if passed.
export default function OutreachEmail({ body = "", unsub = "", mailingAddress }) {
    const address = mailingAddress || MAILING_ADDRESS;
    // Split into paragraphs on blank lines; preserve single newlines inside a paragraph.
    const paragraphs = String(body)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

    return (
        <Html lang="en">
            <Head />
            <Body style={s.body}>
                <Container style={s.container}>
                    <Section>
                        {paragraphs.map((para, i) => (
                            <Text key={i} style={s.p}>{para}</Text>
                        ))}
                    </Section>
                    <Hr style={s.hr} />
                    <Section>
                        <Text style={s.footer}>
                            You're receiving this because I thought Pythias might genuinely help your shop. If you'd
                            rather not hear from me,{" "}
                            <Link href={unsub} style={s.footerLink}>unsubscribe here</Link>.
                        </Text>
                        <Text style={s.footer}>{address}</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

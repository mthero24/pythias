import { sanitizeHtml } from "../lib/sanitizeHtml";

// Custom HTML section — the seller's (or AI's) own markup, sanitized at render. The author controls the
// layout; they're nudged to use var(--sf-*) theme variables + .sf-container so it matches the store.
export default function CustomHtml({ settings = {} }) {
    const html = sanitizeHtml(settings.html || "");
    if (!html.trim()) return null;
    return <div className="sf-custom-section" dangerouslySetInnerHTML={{ __html: html }} />;
}

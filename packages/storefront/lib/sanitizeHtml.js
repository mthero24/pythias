// Lightweight sanitizer for seller/AI custom-section HTML. The content is the store owner's own, but it
// renders in buyers' browsers, so we strip the dangerous bits: <script>, inline event handlers (on*),
// and javascript: URLs. General markup, inline styles, and embeds (iframe/img/etc.) are allowed.
// This is the authoritative defense — applied at render time regardless of how the HTML was authored.
export function sanitizeHtml(html) {
    if (!html || typeof html !== "string") return "";
    let out = html;
    out = out.replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "");   // <script>…</script>
    out = out.replace(/<\s*script\b[^>]*>/gi, "");                       // stray/self-closing <script>
    out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");                    // onClick="…"
    out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, "");                    // onClick='…'
    out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");                    // onClick=…
    out = out.replace(/(href|src|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
    out = out.replace(/(href|src|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
    return out;
}

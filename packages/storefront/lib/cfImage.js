// Wrap a platform renderImages URL with Cloudflare Image Transformations so browsers get AVIF/WebP
// (format=auto) at the right size — ~50% smaller than the source JPEG — while feeds/marketplaces,
// which fetch the bare .jpg URL (never wrapped), keep getting JPEG. No-op for any non-renderImages URL.
// Same-zone source (platform.pythiastechnologies.com) so no "resize from any origin" is needed.
const MARKER = "/api/renderImages/";
export function cfImg(url, width = 400) {
    if (!url || typeof url !== "string") return url;
    if (url.includes("/cdn-cgi/image/")) return url;   // already wrapped
    const i = url.indexOf(MARKER);
    if (i < 0) return url;                              // external / CDN / data URL — leave as-is
    const host = url.slice(0, i);                       // https://platform.pythiastechnologies.com
    const src = url.slice(i + 1);                       // api/renderImages/...?...  (relative source)
    return `${host}/cdn-cgi/image/width=${width},format=auto,fit=scale-down/${src}`;
}

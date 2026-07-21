// Injected keyframes + hover rules for the garment-shop homepage sections.
// Kept in one place so the section components can stay plain (no "use client").
// All classes are prefixed `gm-` to avoid colliding with home.module.css.
export default function GarmentStyles() {
    const css = `
    .gm-ticker{overflow:hidden}
    .gm-ticker-track{display:flex;white-space:nowrap;will-change:transform;animation:gm-scroll 46s linear infinite}
    .gm-ticker:hover .gm-ticker-track{animation-play-state:paused}
    @keyframes gm-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .gm-card{transition:transform .18s ease,border-color .18s ease}
    .gm-card:hover{transform:translateY(-4px);border-color:rgba(211,167,61,0.55)}
    .gm-btn{transition:transform .12s ease,filter .15s ease,border-color .15s ease,color .15s ease}
    .gm-btn-gold:hover{transform:translateY(-1px);filter:brightness(1.06)}
    .gm-btn-ghost:hover{border-color:#D3A73D;color:#D3A73D}
    .gm-btn .gm-arw{display:inline-block;transition:transform .15s ease}
    .gm-btn:hover .gm-arw{transform:translateX(3px)}
    .gm-blink{animation:gm-blink 1.6s ease-in-out infinite}
    @keyframes gm-blink{0%,100%{opacity:1}50%{opacity:.35}}
    @media(prefers-reduced-motion:reduce){
      .gm-ticker-track,.gm-blink{animation:none!important}
      .gm-card,.gm-btn,.gm-arw{transition:none!important}
    }
  `;
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

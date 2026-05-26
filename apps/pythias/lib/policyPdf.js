import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const GOLD   = rgb(211/255, 167/255,  61/255);
const NAVY   = rgb( 15/255,  23/255,  42/255);
const DARK   = rgb( 17/255,  24/255,  39/255);
const GRAY   = rgb( 75/255,  85/255,  99/255);
const LGRAY  = rgb(156/255, 163/255, 175/255);
const WHITE  = rgb(1, 1, 1);
const BORDER = rgb(0.898, 0.906, 0.922);
const SUBTEXT = rgb(0.55, 0.60, 0.70);

const PW = 612, PH = 792, ML = 60, CW = 492;

function wrap(str, font, size, maxW) {
  const result = [];
  for (const para of (str || "").split("\n")) {
    const words = para.split(" ").filter(Boolean);
    if (!words.length) { result.push(""); continue; }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(test, size) > maxW) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) result.push(line);
  }
  return result.length ? result : [""];
}

export async function buildPolicyPdf(policy) {
  const doc = await PDFDocument.create();
  const R   = await doc.embedFont(StandardFonts.Helvetica);
  const B   = await doc.embedFont(StandardFonts.HelveticaBold);

  const allPages = [];
  let page, y;

  function newPage() {
    page = doc.addPage([PW, PH]);
    allPages.push(page);
    y = ML;
  }

  const py = () => PH - y;

  function need(h) {
    if (!page || y + h > PH - ML - 30) newPage();
  }

  function para(text, { font = R, size = 10, color = GRAY, indent = 0 } = {}) {
    const lines = wrap(text, font, size, CW - indent);
    const lh = size * 1.4;
    for (const line of lines) {
      need(size + 6);
      page.drawText(line, { x: ML + indent, y: py() - size, size, font, color });
      y += lh;
    }
  }

  function gap(n = 6) { y += n; }

  function hr() {
    need(2);
    page.drawLine({ start: { x: ML, y: py() }, end: { x: PW - ML, y: py() }, thickness: 0.5, color: BORDER });
    y += 10;
  }

  function sectionHead(num, title) {
    need(30);
    const top = py();
    page.drawCircle({ x: ML + 11, y: top - 11, size: 11, color: GOLD });
    const nw = B.widthOfTextAtSize(num, 8);
    page.drawText(num,   { x: ML + 11 - nw / 2, y: top - 15, size: 8,  font: B, color: WHITE });
    page.drawText(title, { x: ML + 28,           y: top - 14, size: 13, font: B, color: DARK });
    y += 24;
  }

  function bullet(text) {
    const lines = wrap(text, R, 10, CW - 18);
    const lh = 10 * 1.4;
    need(lh + 4);
    page.drawCircle({ x: ML + 6, y: py() - 5, size: 2.5, color: GOLD });
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) need(lh + 2);
      page.drawText(lines[i], { x: ML + 18, y: py() - 10, size: 10, font: R, color: GRAY });
      y += lh;
    }
    y += 2;
  }

  function subhead(text) {
    y += 3;
    need(16);
    page.drawText(text, { x: ML, y: py() - 11, size: 10.5, font: B, color: DARK });
    y += 16;
  }

  function classification(label, text) {
    const badgeW = 108, badgeH = 18;
    const textW  = CW - badgeW - 12;
    const lines  = wrap(text, R, 9.5, textW);
    const textH  = lines.length * 9.5 * 1.4;
    const blockH = Math.max(badgeH + 4, textH + 4);
    need(blockH + 8);

    const top = py();
    page.drawRectangle({ x: ML, y: top - badgeH, width: badgeW, height: badgeH, color: GOLD });
    const lw = B.widthOfTextAtSize(label, 7.5);
    page.drawText(label, { x: ML + (badgeW - lw) / 2, y: top - 13, size: 7.5, font: B, color: WHITE });

    let ty = top;
    for (const line of lines) {
      page.drawText(line, { x: ML + badgeW + 12, y: ty - 9.5, size: 9.5, font: R, color: GRAY });
      ty -= 9.5 * 1.4;
    }
    y += blockH + 4;
  }

  // ── Header ────────────────────────────────────────────────────
  newPage();
  const HEADER_H = 142;

  page.drawRectangle({ x: 0, y: PH - HEADER_H, width: PW, height: HEADER_H, color: NAVY });
  page.drawRectangle({ x: 0, y: PH - 3,         width: PW, height: 3,         color: GOLD });

  page.drawText("LEGAL & COMPLIANCE", {
    x: ML, y: PH - 29, size: 7.5, font: B, color: GOLD,
  });
  page.drawText(policy.title, {
    x: ML, y: PH - 62, size: 20, font: B, color: WHITE,
  });
  page.drawText(`Effective: ${policy.effectiveDate}   ·   Next review: ${policy.reviewDate}`, {
    x: ML, y: PH - 90, size: 9, font: R, color: SUBTEXT,
  });
  page.drawText("Pythias Technologies, LLC", {
    x: ML, y: PH - 108, size: 9, font: R, color: SUBTEXT,
  });

  y = HEADER_H + 22;

  // ── Sections ──────────────────────────────────────────────────
  for (let s = 0; s < policy.sections.length; s++) {
    const sec = policy.sections[s];
    sectionHead(sec.number, sec.title);
    for (const item of sec.body) {
      if      (item.type === "p")              { para(item.text); gap(3); }
      else if (item.type === "li")             bullet(item.text);
      else if (item.type === "sub")            subhead(item.text);
      else if (item.type === "classification") classification(item.label, item.text);
    }
    if (s < policy.sections.length - 1) { gap(4); hr(); }
  }

  // ── Footer on every page ─────────────────────────────────────
  const total = allPages.length;
  const copy  = `© ${new Date().getFullYear()} Pythias Technologies, LLC · pythiastechnologies.com/policies/${policy.slug}`;
  for (let i = 0; i < total; i++) {
    const p = allPages[i];
    p.drawLine({ start: { x: ML, y: 32 }, end: { x: PW - ML, y: 32 }, thickness: 0.5, color: BORDER });
    p.drawText(copy, { x: ML, y: 18, size: 7.5, font: R, color: LGRAY });
    const label = `Page ${i + 1} of ${total}`;
    p.drawText(label, { x: PW - ML - R.widthOfTextAtSize(label, 7.5), y: 18, size: 7.5, font: R, color: LGRAY });
  }

  return Buffer.from(await doc.save());
}

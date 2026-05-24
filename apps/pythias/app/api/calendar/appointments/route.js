import { NextResponse } from "next/server";

const ICAL_BASE =
  "https://calendar.google.com/calendar/ical/michaelthero%40pythiastechnologies.com/public/basic.ics";

function unfoldLines(raw) {
  return raw.replace(/\r?\n[ \t]/g, "");
}

function parseVEvents(ical) {
  const unfolded = unfoldLines(ical);
  const events = [];
  const blocks = unfolded.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const block   = blocks[i];
    const uid     = (block.match(/^UID:(.+)$/m)            ?? [])[1]?.trim();
    const start   = (block.match(/^DTSTART[^:]*:(.+)$/m)   ?? [])[1]?.trim();
    const summary = (block.match(/^SUMMARY:(.+)$/m)        ?? [])[1]?.trim();
    if (uid) events.push({ uid, start: start ?? null, summary: summary ?? "" });
  }
  return events;
}

export async function GET() {
  // Bust Google's CDN cache with a timestamp query param
  const url = `${ICAL_BASE}?t=${Date.now()}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":    "PythiasTech/1.0",
        "Cache-Control": "no-cache, no-store",
        "Pragma":        "no-cache",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 502 });
    }

    const text   = await res.text();
    const events = parseVEvents(text);

    return NextResponse.json({ events }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

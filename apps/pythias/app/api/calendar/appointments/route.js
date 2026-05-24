import { NextResponse } from "next/server";

const ICAL_URL =
  "https://calendar.google.com/calendar/ical/michaelthero%40pythiastechnologies.com/public/basic.ics";

function unfoldLines(raw) {
  return raw.replace(/\r?\n[ \t]/g, "");
}

function parseVEvents(ical) {
  const unfolded = unfoldLines(ical);
  const events = [];
  const blocks = unfolded.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const uid     = (block.match(/^UID:(.+)$/m) ?? [])[1]?.trim();
    const start   = (block.match(/^DTSTART[^:]*:(.+)$/m) ?? [])[1]?.trim();
    const summary = (block.match(/^SUMMARY:(.+)$/m) ?? [])[1]?.trim();
    if (uid) events.push({ uid, start: start ?? null, summary: summary ?? "" });
  }
  return events;
}

export async function GET() {
  try {
    const res = await fetch(ICAL_URL, {
      headers: { "User-Agent": "PythiasTech/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 502 });
    }
    const text   = await res.text();
    const events = parseVEvents(text);
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

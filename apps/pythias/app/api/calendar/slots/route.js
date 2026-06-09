import { NextResponse } from "next/server";
import { DemoBooking } from "@pythias/mongo";

// 30-min slots Mon–Fri, 9:00 AM – 4:00 PM ET (last slot 4:00 PM, 1-hour event ends 5:00 PM)
const ALL_SLOTS = [];
for (let h = 9; h <= 16; h++) {
    ALL_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 16) ALL_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function addMinutes(time, mins) {
    const [h, m] = time.split(":").map(Number);
    const total  = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Reject weekends (use noon UTC to avoid DST edge cases)
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0=Sun 6=Sat
    if (dow === 0 || dow === 6) {
        return NextResponse.json({
            slots: ALL_SLOTS.map((time) => ({ time, available: false })),
        });
    }

    // Fetch confirmed bookings for this date
    const bookings  = await DemoBooking.find({ date, status: { $ne: "cancelled" } }).lean();
    const takenTimes = new Set(bookings.map((b) => b.startTime));

    // Each 1-hour booking blocks: the slot 30 min before, the slot itself, and the slot 30 min after.
    // This prevents any two bookings whose 1-hour windows would overlap.
    const unavailable = new Set();
    for (const t of takenTimes) {
        unavailable.add(addMinutes(t, -30));
        unavailable.add(t);
        unavailable.add(addMinutes(t, 30));
    }

    // Also block past slots for today
    const nowET = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Detroit" })
    );
    const todayET = `${nowET.getFullYear()}-${String(nowET.getMonth() + 1).padStart(2, "0")}-${String(nowET.getDate()).padStart(2, "0")}`;
    const isToday = date === todayET;

    const slots = ALL_SLOTS.map((time) => {
        if (unavailable.has(time)) return { time, available: false };
        if (isToday) {
            const [sh, sm] = time.split(":").map(Number);
            const slotMins = sh * 60 + sm;
            const nowMins  = nowET.getHours() * 60 + nowET.getMinutes() + 60; // require 1hr lead time
            if (slotMins <= nowMins) return { time, available: false };
        }
        return { time, available: true };
    });

    return NextResponse.json({ slots }, {
        headers: { "Cache-Control": "no-store" },
    });
}

import { NextResponse } from "next/server";
import { DemoBooking } from "@pythias/mongo";
import { createDemoEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmation, sendBookingInternalAlert } from "@/lib/email";

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE  = /^[+\d\s\-(). ]{7,20}$/;
const DATE_RE   = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE   = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID_SLOTS = new Set([
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00",
]);

function addMinutes(time, mins) {
    const [h, m] = time.split(":").map(Number);
    const total  = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export async function POST(req) {
    try {
        const { name, email, company, phone, date, startTime } = await req.json();

        // Validate
        if (!name?.trim())                               return NextResponse.json({ error: "Name is required."  }, { status: 400 });
        if (!email?.trim() || !EMAIL_RE.test(email))    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
        if (!DATE_RE.test(date))                         return NextResponse.json({ error: "Invalid date." }, { status: 400 });
        if (!TIME_RE.test(startTime) || !VALID_SLOTS.has(startTime))
                                                         return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
        if (phone?.trim() && !PHONE_RE.test(phone.trim()))
                                                         return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });

        // Reject weekends
        const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
        if (dow === 0 || dow === 6)                      return NextResponse.json({ error: "Weekends are not available." }, { status: 400 });

        const endTime = addMinutes(startTime, 60);

        // Re-check availability (prevents overlap even if two requests arrive simultaneously;
        // the unique index on {date, startTime} is the hard guarantee)
        const blocked = [
            addMinutes(startTime, -30),
            startTime,
            addMinutes(startTime, 30),
        ];
        const conflict = await DemoBooking.findOne({
            date,
            startTime: { $in: blocked },
            status:    { $ne: "cancelled" },
        }).lean();
        if (conflict) {
            return NextResponse.json({ error: "That slot was just taken. Please choose another time." }, { status: 409 });
        }

        // Create Google Meet event (graceful — booking proceeds even if this fails)
        let meetLink = "";
        let googleEventId = "";
        try {
            const meetResult = await createDemoEvent({
                name:      name.trim(),
                email:     email.trim().toLowerCase(),
                company:   company?.trim() ?? "",
                date,
                startTime,
                endTime,
            });
            meetLink     = meetResult.meetLink;
            googleEventId = meetResult.eventId;
        } catch (meetErr) {
            console.error("[calendar/book] Google Meet creation failed:", meetErr.message);
        }

        // Save booking
        const booking = await DemoBooking.create({
            name:      name.trim(),
            email:     email.trim().toLowerCase(),
            company:   company?.trim() ?? "",
            phone:     phone?.trim()   ?? "",
            date,
            startTime,
            endTime,
            meetLink,
            googleEventId,
        });

        // Send emails (fire-and-forget)
        Promise.all([
            sendBookingConfirmation({
                to:        email.trim(),
                name:      name.trim(),
                date,
                startTime,
                meetLink,
            }),
            sendBookingInternalAlert({
                name:      name.trim(),
                email:     email.trim(),
                company:   company?.trim() ?? "",
                phone:     phone?.trim()   ?? "",
                date,
                startTime,
                meetLink,
            }),
        ]).catch((e) => console.error("[calendar/book] email error:", e.message));

        return NextResponse.json({
            success:   true,
            meetLink,
            date,
            startTime,
            bookingId: booking._id,
        });
    } catch (err) {
        // Duplicate key = slot was taken between our check and insert
        if (err.code === 11000) {
            return NextResponse.json({ error: "That slot was just taken. Please choose another time." }, { status: 409 });
        }
        console.error("[calendar/book]", err);
        return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
    }
}

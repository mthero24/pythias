import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "michaelthero@pythiastechnologies.com";
const TIMEZONE    = "America/Detroit";

function getClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key:  (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
    });
    return google.calendar({ version: "v3", auth });
}

export async function createDemoEvent({ name, email, company, date, startTime, endTime }) {
    const cal = getClient();

    const res = await cal.events.insert({
        calendarId:             CALENDAR_ID,
        conferenceDataVersion:  1,
        sendUpdates:            "none", // we send our own confirmation emails
        requestBody: {
            summary:     `Demo: ${name}${company ? ` — ${company}` : ""}`,
            description: `Booked via pythiastechnologies.com\nEmail: ${email}`,
            start: { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE },
            end:   { dateTime: `${date}T${endTime}:00`,   timeZone: TIMEZONE },
            conferenceData: {
                createRequest: {
                    requestId:              `pythias-demo-${date}-${startTime}-${Math.random().toString(36).slice(2, 8)}`,
                    conferenceSolutionKey:  { type: "hangoutsMeet" },
                },
            },
            attendees: [
                { email, displayName: name },
                { email: CALENDAR_ID },
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "email",  minutes: 24 * 60 },
                    { method: "popup",  minutes: 30 },
                ],
            },
        },
    });

    const meetLink = res.data.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
    )?.uri ?? "";

    return { eventId: res.data.id, meetLink };
}

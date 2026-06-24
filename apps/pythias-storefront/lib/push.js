// Send an Expo push notification to one or more Expo push tokens (the white-label mobile app).
// Fire-and-forget; never throws. Batches up to 100 messages per request (Expo's limit).
export async function sendExpoPush(tokens, { title, body, data } = {}) {
    const list = (Array.isArray(tokens) ? tokens : [tokens]).filter((t) => typeof t === "string" && t.startsWith("ExponentPushToken"));
    if (!list.length) return;
    const messages = list.map((to) => ({ to, title, body, sound: "default", ...(data ? { data } : {}) }));
    for (let i = 0; i < messages.length; i += 100) {
        try {
            await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(messages.slice(i, i + 100)),
            });
        } catch (e) { console.error("[expoPush] send failed:", e?.message); }
    }
}

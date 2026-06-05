import { ContactMessages } from "@pythias/backend";
import { ContactMessage } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export default async function ContactMessagesPage() {
    let messages = [];
    try {
        const raw = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
        messages = JSON.parse(JSON.stringify(raw));
    } catch (e) {
        console.error("[contact-messages page]", e);
    }
    return <ContactMessages messages={messages} apiUrl="/api/admin/contact-messages" />;
}

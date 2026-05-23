import { ContactMessages, serialize } from "@pythias/backend";
import { ContactMessage } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export default async function ContactMessagesPage() {
  const raw = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
  const messages = serialize(raw);
  return <ContactMessages messages={messages} apiUrl="/api/admin/contact-messages" />;
}

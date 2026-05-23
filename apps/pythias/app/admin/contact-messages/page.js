import { ContactMessages } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default function ContactMessagesPage() {
    return <ContactMessages apiUrl="/api/admin/contact-messages" />;
}

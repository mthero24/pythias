import { ContactForm } from "@pythias/backend";

export const metadata = {
  title: "Contact Us | Premier Printing",
  description: "Get in touch with Premier Printing. Phone: (844) 579-8442. Located in Southfield, MI.",
};

export default function ContactPage() {
  return <ContactForm apiUrl="/api/contact" />;
}

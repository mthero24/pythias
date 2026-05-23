import { ContactForm } from "@pythias/backend";

export const metadata = {
    title: "Contact Us | Pythias Technologies",
    description: "Get in touch with Pythias Technologies. Phone: (844) 579-8442. Located in Southfield, MI.",
};

export default function ContactPage() {
    return (
        <ContactForm
            apiUrl="/api/contact"
            companyName="Pythias Technologies"
            phone="(844) 579-8442"
            address="21440 Melrose Ave, Southfield MI 48075"
            email="info@pythiastechnologies.com"
            tagline="Your print-on-demand fulfillment technology partner."
        />
    );
}

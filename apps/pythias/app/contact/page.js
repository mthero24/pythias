import { ContactForm } from "@pythias/backend";

export const metadata = {
    title: "Contact Us",
    description: "Get in touch with Pythias Technologies. Phone: (844) 579-8442. Located in Southfield, MI.",
    alternates: { canonical: "https://pythiastechnologies.com/contact" },
};

const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Pythias Technologies",
    url: "https://pythiastechnologies.com/contact",
    description: "Get in touch with the Pythias Technologies team.",
    mainEntity: {
        "@type": "Organization",
        name: "Pythias Technologies",
        telephone: "+18445798442",
        email: "info@pythiastechnologies.com",
        address: {
            "@type": "PostalAddress",
            streetAddress: "21440 Melrose Ave",
            addressLocality: "Southfield",
            addressRegion: "MI",
            postalCode: "48075",
            addressCountry: "US",
        },
    },
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",       item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Contact Us", item: "https://pythiastechnologies.com/contact" },
    ],
};

export default function ContactPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ContactForm
                apiUrl="/api/contact"
                companyName="Pythias Technologies"
                phone="(844) 579-8442"
                address="21440 Melrose Ave, Southfield MI 48075"
                email="info@pythiastechnologies.com"
                tagline="Your print-on-demand fulfillment technology partner."
            />
        </>
    );
}

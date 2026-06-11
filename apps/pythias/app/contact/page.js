import { ContactForm } from "@pythias/backend";

export const metadata = {
    title: "Contact Pythias Technologies — Print Fulfillment Support",
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
            streetAddress: "1421 Hidden View Drive",
            addressLocality: "Lapeer",
            addressRegion: "MI",
            postalCode: "48446",
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
            <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
                Contact Pythias Technologies
            </h1>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ContactForm
                apiUrl="/api/contact"
                companyName="Pythias Technologies"
                phone="(844) 579-8442"
                address="1421 Hidden View Drive, Lapeer MI 48446"
                email="info@pythiastechnologies.com"
                tagline="Your print-on-demand fulfillment technology partner."
            />
        </>
    );
}

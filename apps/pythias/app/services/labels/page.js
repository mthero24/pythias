import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Label & Barcode Printing for Print Shops",
    description: "Print production labels, packing slips, barcodes, and QR codes for every order directly from your dashboard. Bulk label printing, DTF labels, heat press settings labels, and more — no third-party tools needed.",
    keywords: "production label printing, barcode printing print shop, packing slip software, QR code labels, DTF production labels, heat press labels, bulk label printing, thermal label printer software, print shop label management",
    openGraph: {
        title: "Label & Barcode Printing | Pythias Technologies",
        description: "Print production labels, barcodes, packing slips, and QR codes for every order — directly from the Pythias dashboard.",
        type: "website",
        url: "https://pythiastechnologies.com/services/labels",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/labels" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Label & Barcode Printing",
    applicationCategory: "BusinessApplication",
    description: "Production label and barcode printing software for print-on-demand and custom apparel operations.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "🏷️", title: "Production Labels",              desc: "Print labels for every order with customer name, design file, blank specs, and production line assignment — auto-generated from order data." },
    { icon: "📄", title: "Packing Slips",                  desc: "Generate branded packing slips for every shipment. Include order summary, customer details, and custom messages without any manual formatting." },
    { icon: "📊", title: "Barcode Generation",             desc: "Create scannable barcodes for any order or product. Use them to scan orders through production stages and trigger status updates." },
    { icon: "📱", title: "QR Code Labels",                 desc: "QR code labels link directly to the order detail page. Scan with any phone camera to pull up full order information instantly." },
    { icon: "🔥", title: "Heat Press Settings Labels",     desc: "Print labels for every heat press station with time, temperature, and pressure settings for each blank type — no more sticky notes." },
    { icon: "🎨", title: "DTF & Design Labels",            desc: "Print gang sheet labels, transfer identification tags, and order reference codes that stick to DTF prints through the production process." },
    { icon: "📦", title: "Bulk Label Printing",            desc: "Select any group of orders and print all their labels in one batch. Sort by carrier, product type, or shipping deadline before printing." },
    { icon: "🖨️", title: "Multi-Printer Support",         desc: "Print to thermal printers (Zebra, Rollo, Dymo), standard laser printers, and label sheets. Configure different printers per department." },
    { icon: "🔄", title: "Reprint & Void",                 desc: "Reprint any label instantly if it's damaged or lost. Void labels that were never used to keep your records clean." },
];

const steps = [
    { title: "Order comes in",               desc: "When a new order is received from any marketplace, Pythias generates all the label data automatically from the order details." },
    { title: "Print at the right moment",    desc: "Print production labels when an order enters the queue, packing slips when it completes, and shipping labels when it's ready to go." },
    { title: "Scan through production",      desc: "Barcodes and QR codes allow staff to scan orders at each production stage, updating status without touching a keyboard." },
    { title: "Ship with confidence",         desc: "The right label reaches every package because labels are tied directly to the order — not manually matched by your team." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                       item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                   item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Label & Barcode Printing",   item: "https://pythiastechnologies.com/services/labels" },
    ],
};

export default function LabelsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Label & Barcode Printing"
                title="The right label on"
                accent="every order, every time."
                subtitle="Production labels, packing slips, barcodes, QR codes, and heat press settings labels — all generated automatically from your order data and printed with one click."
                icon="🏷️"
                color="#f59e0b"
            />
            <ServiceFeatures features={features} color="#f59e0b" />
            <ServiceSteps steps={steps} color="#f59e0b" />
            <ServiceCTA
                title="Eliminate mislabeled orders for good."
                sub="When labels are generated directly from order data, the right info gets to the right package — automatically."
                color="#f59e0b"
            />
            <ServiceRelated related={[
                { href: "/services/production",  label: "Production Queue Management" },
                { href: "/services/shipping",    label: "Shipping & Fulfillment" },
                { href: "/services/team",        label: "Team & Collaboration" },
            ]} />
        </>
    );
}

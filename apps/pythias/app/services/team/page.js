import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Team & Collaboration Tools",
    description: "Role-based access, built-in team messaging, time tracking, badge scan login, shift management, and activity logs — all the tools your print shop team needs in one platform.",
    keywords: "print shop team management, employee time tracking, role-based access print software, team collaboration tools, badge scan login, shift management software, production team tools, print on demand team",
    openGraph: {
        title: "Team & Collaboration Tools | Pythias Technologies",
        description: "Role-based access, built-in messaging, time tracking, and badge scan login for print shop teams.",
        type: "website",
        url: "https://pythiastechnologies.com/services/team",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/team" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Team & Collaboration Tools",
    applicationCategory: "BusinessApplication",
    description: "Team management, collaboration, and access control tools for print-on-demand production teams.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "🔐", title: "Role-Based Access Control",      desc: "Assign Admin, Manager, or Production roles to each team member. Control exactly which screens and actions each role can access." },
    { icon: "💬", title: "Built-In Team Messaging",        desc: "Direct messages and group chats built right into the platform. Share order updates, flag issues, and coordinate without leaving the app." },
    { icon: "🕐", title: "Time Tracking (Clockwise)",      desc: "Employees clock in and out directly in Pythias. See hours per shift, overtime alerts, and weekly totals per employee." },
    { icon: "🔖", title: "Badge Scan Login",               desc: "Floor staff scan a printed badge to log in — no password needed at production stations. Fast, secure, and hands-free." },
    { icon: "📋", title: "Activity Logs",                  desc: "Every action in the system is logged — who did what, when, and on which order. Essential for accountability and dispute resolution." },
    { icon: "👥", title: "Shift Management",               desc: "Schedule shifts, assign line supervisors, and see real-time headcount per production area. Know who's on the floor at any moment." },
    { icon: "🔔", title: "Smart Notifications",            desc: "Configurable alerts for rush orders, low stock, missed deadlines, or quality holds. Route notifications by role so the right person gets alerted." },
    { icon: "📱", title: "Mobile-Friendly Views",          desc: "The production dashboard is fully responsive. Floor staff can update order status from a tablet at their station without sitting at a desktop." },
    { icon: "🖼️", title: "Account & Avatar Management",   desc: "Each team member has a personal profile with avatar, role badge, and account settings. Managers can reset passwords from the admin panel." },
];

const steps = [
    { title: "Add your team members",        desc: "Create accounts for every employee with their name, email, and role. Production staff get a printable badge for scan-to-login." },
    { title: "Assign roles and permissions", desc: "Set who can see orders, who can mark jobs complete, and who can access settings or reports. Roles are fully configurable." },
    { title: "Team works in real time",      desc: "Floor staff update job status, managers monitor throughput, and owners review analytics — all from the same platform simultaneously." },
    { title: "Review and improve",           desc: "Activity logs and time tracking data feed into your weekly operations review. Identify gaps and adjust before they affect output." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                   item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",               item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Team & Collaboration",   item: "https://pythiastechnologies.com/services/team" },
    ],
};

export default function TeamPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Team & Collaboration"
                title="Keep your whole team"
                accent="in sync."
                subtitle="Role-based access, built-in messaging, badge scan login, time tracking, and activity logs — everything your floor needs to run a tight, accountable operation."
                icon="👥"
                color="#14b8a6"
            />
            <ServiceFeatures features={features} color="#14b8a6" />
            <ServiceSteps steps={steps} color="#14b8a6" />
            <ServiceCTA
                title="Your team deserves better tools."
                sub="Give every employee — from floor staff to ownership — exactly what they need to do their job well."
                color="#14b8a6"
            />
            <ServiceRelated related={[
                { href: "/services/production",  label: "Production Queue Management" },
                { href: "/services/analytics",   label: "Analytics & Reporting" },
                { href: "/services/labels",      label: "Label & Barcode Printing" },
            ]} />
        </>
    );
}

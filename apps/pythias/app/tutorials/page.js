import { Box, Container, Typography } from "@mui/material";
import { Tutorial } from "@pythias/mongo";
import TutorialsClient from "./TutorialsClient";

export const revalidate = 60;

export const metadata = {
    title: "Tutorials",
    description: "Step-by-step video tutorials for getting the most out of Pythias Technologies — production, shipping, inventory, and more.",
    alternates: { canonical: "https://pythiastechnologies.com/tutorials" },
};

async function getTutorials() {
    try {
        const tutorials = await Tutorial.find({ published: true })
            .sort({ category: 1, order: 1, createdAt: -1 })
            .select("title description category videoUrl thumbnailUrl order")
            .lean();
        return tutorials.map(t => ({ ...t, _id: t._id.toString() }));
    } catch {
        return [];
    }
}

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",      item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Tutorials", item: "https://pythiastechnologies.com/tutorials" },
    ],
};

export default async function TutorialsPage() {
    const tutorials = await getTutorials();

    return (
        <Box component="main">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            {/* Hero */}
            <Box sx={{
                background: "linear-gradient(155deg, #0f172a 0%, #111827 55%, #0c1628 100%)",
                py: { xs: 8, md: 12 },
                textAlign: "center",
            }}>
                <Container maxWidth="md">
                    <Typography
                        sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D3A73D", mb: 2 }}
                    >
                        Learn Pythias
                    </Typography>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", md: "3rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.2, mb: 2 }}>
                        How-To Video Tutorials
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: { xs: "1rem", md: "1.15rem" }, lineHeight: 1.8, maxWidth: 560, mx: "auto" }}>
                        Everything you need to master the platform — from your first order to advanced automation workflows.
                    </Typography>
                </Container>
            </Box>

            {/* Content */}
            <Box sx={{ bgcolor: "#fff", py: { xs: 6, md: 10 } }}>
                <Container maxWidth="xl">
                    {tutorials.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 10 }}>
                            <Typography color="text.secondary">Tutorials coming soon. Check back shortly.</Typography>
                        </Box>
                    ) : (
                        <TutorialsClient tutorials={tutorials} />
                    )}
                </Container>
            </Box>
        </Box>
    );
}

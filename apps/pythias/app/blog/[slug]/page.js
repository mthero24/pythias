import { Article } from "@pythias/mongo";
import { notFound } from "next/navigation";
import { Box, Container, Typography, Chip, Stack, Divider, Button } from "@mui/material";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BlogReadTracker from "@/componants/BlogReadTracker";

export const revalidate = 60;

export async function generateMetadata({ params }) {
    const article = await Article.findOne({ slug: params.slug, published: true }).lean();
    if (!article) return {};
    return {
        title: article.title,
        description: article.metaDescription || article.excerpt || "",
        alternates: { canonical: `https://pythiastechnologies.com/blog/${params.slug}` },
        openGraph: {
            title: article.title,
            description: article.metaDescription || article.excerpt || "",
            images: article.coverImage ? [article.coverImage] : [],
        },
    };
}

async function getArticle(slug) {
    try {
        return await Article.findOne({ slug, published: true }).lean();
    } catch {
        return null;
    }
}

export default async function ArticlePage({ params }) {
    const article = await getArticle(params.slug);
    if (!article) notFound();

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.metaDescription || article.excerpt || "",
        ...(article.coverImage ? { image: article.coverImage } : {}),
        ...(article.publishedAt ? { datePublished: new Date(article.publishedAt).toISOString() } : {}),
        ...(article.updatedAt ? { dateModified: new Date(article.updatedAt).toISOString() } : {}),
        author: { "@type": article.author ? "Person" : "Organization", name: article.author || "Pythias Technologies" },
        publisher: {
            "@type": "Organization",
            name: "Pythias Technologies",
            logo: { "@type": "ImageObject", url: "https://pythiastechnologies.com/logo.png" },
        },
        url: `https://pythiastechnologies.com/blog/${article.slug}`,
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://pythiastechnologies.com/blog/${article.slug}` },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home",         item: "https://pythiastechnologies.com" },
            { "@type": "ListItem", position: 2, name: "Blog",         item: "https://pythiastechnologies.com/blog" },
            { "@type": "ListItem", position: 3, name: article.title,  item: `https://pythiastechnologies.com/blog/${article.slug}` },
        ],
    };

    return (
        <Box sx={{ bgcolor: "#f8faff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            {article.faqJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article.faqJsonLd) }} />
            )}

            <Container maxWidth="md">
                <Button
                    component={Link}
                    href="/blog"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 4, color: "text.secondary" }}
                >
                    All articles
                </Button>

                {article.coverImage && (
                    <Box
                        component="img"
                        src={article.coverImage}
                        alt={article.title}
                        sx={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 3, mb: 4 }}
                    />
                )}

                <Typography variant="overline" color="text.secondary">
                    {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                        : ""}
                    {article.author ? ` · ${article.author}` : ""}
                </Typography>

                <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: 800, mt: 1, lineHeight: 1.2 }} gutterBottom>
                    {article.title}
                </Typography>

                {article.tags?.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
                        {article.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" component={Link} href={`/blog?tag=${tag}`} clickable />
                        ))}
                    </Stack>
                )}

                <Divider sx={{ mb: 4 }} />

                <Box
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                    sx={{
                        "& h1,& h2,& h3,& h4": { fontWeight: 700, mt: 4, mb: 1.5 },
                        "& h1": { fontSize: "2rem" },
                        "& h2": { fontSize: "1.5rem" },
                        "& h3": { fontSize: "1.25rem" },
                        "& p": { mb: 2, lineHeight: 1.8, color: "#333" },
                        "& ul,& ol": { pl: 3, mb: 2 },
                        "& li": { mb: 0.5, lineHeight: 1.8 },
                        "& a": { color: "#6366f1", textDecoration: "underline" },
                        "& img": { maxWidth: "100%", borderRadius: 2, my: 2 },
                        "& blockquote": { borderLeft: "4px solid #6366f1", pl: 2, my: 2, color: "text.secondary", fontStyle: "italic" },
                        "& pre": { bgcolor: "#1e1e2e", color: "#cdd6f4", p: 2, borderRadius: 2, overflow: "auto", my: 2 },
                        "& code": { fontFamily: "monospace", fontSize: "0.875em", bgcolor: "#f0f0f5", px: 0.5, borderRadius: 0.5 },
                        "& pre code": { bgcolor: "transparent", p: 0 },
                    }}
                />
                <BlogReadTracker slug={params.slug} />
            </Container>
        </Box>
    );
}

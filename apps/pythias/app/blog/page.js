import { Article } from "@pythias/mongo";
import Link from "next/link";
import { Box, Container, Typography, Grid2, Card, CardActionArea, Chip, Stack } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";

export const metadata = {
    title: "Blog",
    description: "Insights, guides, and updates from the Pythias Technologies team.",
    alternates: { canonical: "https://pythiastechnologies.com/blog" },
};

export const revalidate = 60;

async function getArticles() {
    try {
        return await Article.find({ published: true })
            .sort({ publishedAt: -1 })
            .limit(24)
            .select("title slug excerpt tags coverImage publishedAt author")
            .lean();
    } catch {
        return [];
    }
}

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://pythiastechnologies.com/blog" },
    ],
};

export default async function BlogPage() {
    const articles = await getArticles();

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Pythias Technologies Blog",
        description: "Insights, guides, and updates from the Pythias Technologies team.",
        url: "https://pythiastechnologies.com/blog",
        ...(articles.length > 0 ? {
            hasPart: articles.map(a => ({
                "@type": "Article",
                headline: a.title,
                url: `https://pythiastechnologies.com/blog/${a.slug}`,
                ...(a.publishedAt ? { datePublished: new Date(a.publishedAt).toISOString() } : {}),
            })),
        } : {}),
    };

    return (
        <Box sx={{ bgcolor: "#f8faff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <Container maxWidth="lg">
                <Box sx={{ mb: 6, textAlign: "center" }}>
                    <Typography variant="h1" sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, fontWeight: 800 }} gutterBottom>
                        Blog
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Insights, guides, and updates from the Pythias team.
                    </Typography>
                </Box>

                {articles.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                        <ArticleIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                        <Typography color="text.secondary">No articles yet. Check back soon.</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={3} className="h-feed">
                        {articles.map((article) => (
                            <Grid2 key={article.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{ height: "100%", borderRadius: 3 }}
                                    itemScope
                                    itemType="https://schema.org/BlogPosting"
                                    className="h-entry"
                                    component="article"
                                >
                                    <CardActionArea
                                        component={Link}
                                        href={`/blog/${article.slug}`}
                                        itemProp="url"
                                        className="u-url"
                                        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
                                    >
                                        {article.coverImage && (
                                            <Box
                                                component="img"
                                                src={article.coverImage}
                                                alt={article.title}
                                                itemProp="image"
                                                className="u-photo"
                                                sx={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 2, mb: 2 }}
                                            />
                                        )}
                                        <Typography variant="overline" color="text.secondary" fontSize={11} component="div">
                                            {article.publishedAt ? (
                                                <time
                                                    dateTime={new Date(article.publishedAt).toISOString()}
                                                    itemProp="datePublished"
                                                    className="dt-published"
                                                >
                                                    {new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                                </time>
                                            ) : null}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }} itemProp="headline" className="p-name">
                                            {article.title}
                                        </Typography>
                                        {article.excerpt && (
                                            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2 }} itemProp="description" className="p-summary">
                                                {article.excerpt.length > 150 ? article.excerpt.slice(0, 150) + "…" : article.excerpt}
                                            </Typography>
                                        )}
                                        {article.tags?.length > 0 && (
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {article.tags.slice(0, 3).map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" sx={{ fontSize: 11 }} />
                                                ))}
                                            </Stack>
                                        )}
                                    </CardActionArea>
                                </Card>
                            </Grid2>
                        ))}
                    </Grid2>
                )}
            </Container>
        </Box>
    );
}

import { Article } from "@pythias/mongo";
import Link from "next/link";
import { Box, Container, Typography, Grid2, Card, CardActionArea, Chip, Stack } from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";

export const metadata = {
    title: "Blog | Pythias Technologies",
    description: "Insights, guides, and updates from the Pythias Technologies team.",
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

export default async function BlogPage() {
    const articles = await getArticles();

    return (
        <Box sx={{ bgcolor: "#f8faff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
                <Box sx={{ mb: 6, textAlign: "center" }}>
                    <Typography variant="h3" fontWeight={800} gutterBottom>
                        Blog
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Insights, guides, and updates from the Pythias team.
                    </Typography>
                </Box>

                {articles.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                        <ArticleIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                        <Typography color="text.secondary">No articles yet. Check back soon.</Typography>
                    </Box>
                ) : (
                    <Grid2 container spacing={3}>
                        {articles.map((article) => (
                            <Grid2 key={article.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                                    <CardActionArea
                                        component={Link}
                                        href={`/blog/${article.slug}`}
                                        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
                                    >
                                        {article.coverImage && (
                                            <Box
                                                component="img"
                                                src={article.coverImage}
                                                alt={article.title}
                                                sx={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 2, mb: 2 }}
                                            />
                                        )}
                                        <Typography variant="overline" color="text.secondary" fontSize={11}>
                                            {article.publishedAt
                                                ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                                                : ""}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                                            {article.title}
                                        </Typography>
                                        {article.excerpt && (
                                            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2 }}>
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

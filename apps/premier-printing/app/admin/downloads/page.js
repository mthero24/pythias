import { Box, Container, Typography, Card, CardContent, Button, Chip, Stack, Grid2 } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const REPO = 'mthero24/pythias-electon-apps';

const APPS = [
    {
        key: 'file-writer',
        name: 'Pythias File Writer',
        description: 'Routes files to hot folders for DTF, embroidery, ROQ, mugs, stickers, and other print types. Runs in the system tray.',
        assetMatch: 'pythias-file-writer-server',
    },
    {
        key: 'internal-server',
        name: 'Pythias Internal Server',
        description: 'Station app for shipping label printing, DTF dispatch, scale weighing, and activity monitoring.',
        assetMatch: 'pythias-internal-server',
    },
];

async function getReleases() {
    try {
        const token = process.env.GITHUB_TOKEN;
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
            headers: {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'pythias-app',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function findLatest(releases, assetMatch) {
    if (!releases) return null;
    const release = releases.find(r =>
        r.assets?.some(a => a.name.toLowerCase().includes(assetMatch))
    );
    if (!release) return null;
    const installer = release.assets.find(a =>
        a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe')
    );
    return {
        version: release.tag_name,
        publishedAt: release.published_at,
        installer,
        releaseUrl: release.html_url,
    };
}

export default async function DownloadsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const releases = await getReleases();

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                    <SystemUpdateAltIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Downloads</Typography>
                        <Typography variant="caption" color="text.secondary">Latest Pythias desktop apps</Typography>
                    </Box>
                </Stack>

                <Grid2 container spacing={3}>
                    {APPS.map(app => {
                        const info = findLatest(releases, app.assetMatch);
                        return (
                            <Grid2 key={app.key} size={{ xs: 12, sm: 6 }}>
                                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{app.name}</Typography>
                                            {info?.version && (
                                                <Chip label={info.version} size="small" color="primary" variant="outlined" sx={{ ml: 1, flexShrink: 0 }} />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            {app.description}
                                        </Typography>
                                        {info?.publishedAt && (
                                            <Typography variant="caption" color="text.disabled">
                                                Released {new Date(info.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </Typography>
                                        )}
                                    </CardContent>
                                    <Box sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            variant={info?.installer ? 'contained' : 'outlined'}
                                            size="small"
                                            fullWidth
                                            startIcon={<DownloadIcon />}
                                            href={info?.installer?.browser_download_url ?? `https://github.com/${REPO}/releases/latest`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {info?.installer ? 'Download Installer (.exe)' : 'View on GitHub'}
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid2>
                        );
                    })}
                </Grid2>

                {!releases && (
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
                        Could not fetch release info — check GITHUB_TOKEN or repo visibility.
                    </Typography>
                )}

            </Container>
        </Box>
    );
}

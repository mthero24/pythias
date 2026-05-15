import { Box, Container, Grid2, Typography, Stack } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";

const CHART_BASE = "https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts";
const PARAMS     = "maxDataAge=3600&theme=light&autoRefresh=true";

const CHARTS = [
    { id: "b1fca3f9-ef86-4071-87b2-990725529fd5", cols: 12, height: 500 },
    { id: "85e7b092-a230-42bc-8d85-07d4188cc23d", cols: 6,  height: 420 },
    { id: "13ef924a-38fd-4006-81d6-92ffd84a1a42", cols: 6,  height: 420 },
    { id: "1a1a29b8-0c22-4b93-aff2-e3af52f4abc9", cols: 6,  height: 420 },
    { id: "2e172baf-4a8d-44c6-833e-17a134c6ce13", cols: 6,  height: 420 },
    { id: "a9fc29f1-49e0-4cd8-aa47-d604a243c14f", cols: 6,  height: 420 },
    { id: "edb7219a-7377-4540-9d58-36c6dd7751e6", cols: 6,  height: 420 },
    { id: "928335c2-4a13-44c7-be2b-30a9707b474e", cols: 6,  height: 420 },
    { id: "56f7e4af-6d69-49bb-bc31-a5f4c8ef5540", cols: 6,  height: 420 },
    { id: "448af33a-3695-48cd-9147-6b073c35a668", cols: 12, height: 500 },
];

export default function Admin() {
    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 3 }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <DashboardIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Dashboard</Typography>
                        <Typography variant="caption" color="text.secondary">Analytics · Auto-refreshes every hour</Typography>
                    </Box>
                </Stack>

                {/* Chart grid */}
                <Grid2 container spacing={2.5}>
                    {CHARTS.map(({ id, cols, height }) => (
                        <Grid2 key={id} size={{ xs: 12, md: cols }}>
                            <Box sx={{
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: "#fff",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)",
                            }}>
                                <iframe
                                    src={`${CHART_BASE}?id=${id}&${PARAMS}`}
                                    style={{ display: "block", width: "100%", height, border: "none", background: "#fff" }}
                                />
                            </Box>
                        </Grid2>
                    ))}
                </Grid2>

            </Container>
        </Box>
    );
}

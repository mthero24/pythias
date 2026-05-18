import { Box, Container, Card, Grid2, Skeleton, Stack } from "@mui/material";

export default function Loading() {
    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Skeleton variant="rounded" width={36} height={36} />
                        <Box>
                            <Skeleton width={140} height={28} />
                            <Skeleton width={100} height={18} />
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Skeleton variant="rounded" width={110} height={34} />
                        <Skeleton variant="rounded" width={110} height={34} />
                        <Skeleton variant="rounded" width={110} height={34} />
                    </Stack>
                </Box>

                {/* Utility card */}
                <Skeleton variant="rounded" height={90} sx={{ mb: 2, borderRadius: 3 }} />

                {/* Filters */}
                <Skeleton variant="rounded" height={64} sx={{ mb: 3, borderRadius: 3 }} />

                {/* Columns */}
                <Grid2 container spacing={2}>
                    {["Standard", "Expedited"].map(label => (
                        <Grid2 size={{ xs: 12, sm: 6 }} key={label}>
                            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                                <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                                    <Skeleton width={120} height={24} />
                                    <Skeleton width={200} height={20} sx={{ mt: 0.5 }} />
                                    <Skeleton variant="rounded" height={36} sx={{ mt: 1, borderRadius: 1 }} />
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <Skeleton key={i} height={44} sx={{ mb: 0.5, borderRadius: 1 }} />
                                    ))}
                                </Box>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>
        </Box>
    );
}

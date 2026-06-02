"use client";
import { Box, Container, Grid2, Card, CardActionArea, CardContent, Typography } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LabelIcon from "@mui/icons-material/Label";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import SewingMachineIcon from "@mui/icons-material/Construction";
import ReplayIcon from "@mui/icons-material/Replay";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useOrg } from "@/components/OrgProvider";

const PATHS = [
    { label: "Shipping",     path: "production/shipping",      icon: <LocalShippingIcon fontSize="large" /> },
    { label: "Print Labels", path: "production/print-labels",  icon: <LabelIcon fontSize="large" /> },
    { label: "Bulk Orders",  path: "production/bulk",          icon: <ViewListIcon fontSize="large" /> },
    { label: "DTF Send",     path: "production/dtf-send",      icon: <PrintIcon fontSize="large" /> },
    { label: "DTF Find",     path: "production/dtf-find",      icon: <SearchIcon fontSize="large" /> },
    { label: "Embroidery",   path: "production/embroidery",    icon: <SewingMachineIcon fontSize="large" /> },
    { label: "Sublimation",  path: "production/sublimation",   icon: <PhotoCameraIcon fontSize="large" /> },
    { label: "Returns",      path: "production/returns",       icon: <ReplayIcon fontSize="large" /> },
    { label: "ROQ Folder",   path: "production/roq-folder",    icon: <FolderOpenIcon fontSize="large" /> },
];

export default function ProductionPage() {
    const { org } = useOrg() ?? {};
    const base = org?.slug ? `/${org.slug}` : "";

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>Production</Typography>
                <Grid2 container spacing={2}>
                    {PATHS.map(link => (
                        <Grid2 key={link.path} size={{ xs: 6, sm: 4, md: 3 }}>
                            <Card variant="outlined" sx={{ height: "100%" }}>
                                <CardActionArea href={`${base}/${link.path}`} sx={{ height: "100%", p: 2 }}>
                                    <CardContent sx={{ textAlign: "center" }}>
                                        <Box sx={{ color: "primary.main", mb: 1 }}>{link.icon}</Box>
                                        <Typography variant="body2" fontWeight={600}>{link.label}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>
        </Box>
    );
}

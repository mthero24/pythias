"use client";
import {
    Box, Typography, Button, Stack, Card, CardContent, Chip, Divider,
    Container, IconButton, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BarChartIcon from "@mui/icons-material/BarChart";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { useState } from "react";
import { AddModal } from "./addModal";
import { ChartModal } from "./chartModal";

const formatAmount = (license) => {
    if (!license.paymentType) return "—";
    if (license.paymentType === "Percentage Per Unit")
        return `${parseFloat(license.amount ?? 0).toFixed(2)}%`;
    return `$${parseFloat(license.amount ?? 0).toFixed(2)}`;
};

const PAYMENT_COLORS = {
    "One Time":              "info",
    "Flat Per Unit":         "primary",
    "Percentage Per Unit":   "warning",
};

export function Main({ licenses }) {
    const [lh, setLh] = useState(licenses ?? []);
    const [li, setLi] = useState(null);
    const [open, setOpen] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);

    const openCreate = () => { setLi(null); setOpen(true); };
    const openEdit   = (l)  => { setLi(l);   setOpen(true); };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
            <Container maxWidth="lg" sx={{ py: 4, minHeight: "90vh" }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CardMembershipIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Licenses{" "}
                                <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                                    ({lh.length})
                                </Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Manage license holders and their payment structures</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => setChartOpen(true)}>
                            View Chart
                        </Button>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                            Create License
                        </Button>
                    </Stack>
                </Box>

                {/* Column headers */}
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr 40px",
                    px: 2, py: 1,
                    borderRadius: 1,
                    backgroundColor: "background.default",
                    border: "1px solid", borderColor: "divider",
                    mb: 0.5,
                }}>
                    {["License Name", "License Type", "Payment Type", "Amount", "Additional Retail", ""].map((col, i) => (
                        <Typography key={i} variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                            {col}
                        </Typography>
                    ))}
                </Box>

                {/* Rows */}
                <Stack spacing={0.5}>
                    {lh.length === 0 && (
                        <Box sx={{ py: 10, textAlign: "center" }}>
                            <CardMembershipIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">No licenses yet. Create one to get started.</Typography>
                        </Box>
                    )}
                    {lh.map((l) => (
                        <Card key={l._id} variant="outlined" sx={{ borderRadius: 1.5, transition: "box-shadow 150ms", "&:hover": { boxShadow: 2 } }}>
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: "2fr 2fr 2fr 1fr 1fr 40px",
                                alignItems: "center",
                                px: 2, py: 1.5,
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {l.name || "—"}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {l.licenseType || "—"}
                                </Typography>

                                <Box>
                                    {l.paymentType ? (
                                        <Chip
                                            label={l.paymentType}
                                            size="small"
                                            color={PAYMENT_COLORS[l.paymentType] ?? "default"}
                                            variant="outlined"
                                            sx={{ fontSize: "0.65rem", height: 20 }}
                                        />
                                    ) : (
                                        <Typography variant="body2" color="text.disabled">—</Typography>
                                    )}
                                </Box>

                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatAmount(l)}
                                </Typography>

                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    ${parseFloat(l.additionalFees ?? 0).toFixed(2)}
                                </Typography>

                                <Tooltip title="Edit license">
                                    <IconButton size="small" onClick={() => openEdit(l)}>
                                        <EditIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            </Container>

            <AddModal open={open} setOpen={setOpen} li={li} setLi={setLi} setLicenses={setLh} />
            <ChartModal open={chartOpen} setOpen={setChartOpen} />
        </Box>
    );
}

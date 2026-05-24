"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, Alert, Typography, Box, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const SETUP_STEPS = [
    {
        step: "1",
        title: "Have an active eBay Seller Account",
        detail: "Sign in to ebay.com and make sure your account is enabled for selling. A Business account gives access to the full Sell API.",
    },
    {
        step: "2",
        title: "Authorize via eBay OAuth",
        detail: "Click \"Connect with eBay\" below. You'll be redirected to eBay to sign in and grant Pythias Technologies access to orders, inventory, and fulfillment.",
    },
    {
        step: "3",
        title: "You're done",
        detail: "After authorizing, eBay will redirect you back here and your store will appear in Active Connections with order pulling enabled.",
    },
];

export function EbayModal({ open, setOpen }) {
    const handleClose = () => setOpen(false);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Connect eBay
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Accordion disableGutters elevation={0} sx={{ borderBottom: "1px solid #e5e7eb", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1.5, bgcolor: "#fff8f0" }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#E53238", flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={600} color="#b91c1c">
                                How to connect your eBay store
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5, bgcolor: "#fff8f0" }}>
                        <Stack spacing={2}>
                            {SETUP_STEPS.map(({ step, title, detail }) => (
                                <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box sx={{
                                        width: 22, height: 22, borderRadius: "50%", bgcolor: "#E53238",
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1,
                                    }}>
                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{step}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{title}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.5 }}>
                                            {detail}
                                        </Typography>
                                    </Box>
                                </Stack>
                            ))}
                            <Alert severity="info" sx={{ mt: 0.5, fontSize: "0.75rem", py: 0.5 }}>
                                eBay uses OAuth — no API key to copy. You'll be redirected to eBay's authorization page and returned automatically.
                            </Alert>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ px: 3, py: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Clicking the button below will redirect you to eBay to sign in and authorize Pythias Technologies. After you approve, eBay will redirect you back and your store will be connected.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    component="a"
                    href="/api/integrations/ebay/oauth/init"
                    sx={{ bgcolor: "#E53238", "&:hover": { bgcolor: "#c0282d" } }}
                >
                    Connect with eBay
                </Button>
            </DialogActions>
        </Dialog>
    );
}

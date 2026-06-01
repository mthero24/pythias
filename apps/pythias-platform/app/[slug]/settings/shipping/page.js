"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOrg } from "@/components/OrgProvider";
import {
    Box, Container, Typography, Stack, TextField, Button,
    Alert, Accordion, AccordionSummary, AccordionDetails, InputAdornment,
    IconButton, Select, MenuItem, FormControl, InputLabel, Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

function MaskedField({ label, value, onChange, helperText, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <TextField label={label} type={show ? "text" : "password"} value={value} onChange={onChange}
            fullWidth size="small" helperText={helperText} placeholder={placeholder} autoComplete="off"
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShow(s => !s)}>
                            {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </InputAdornment>
                ),
            }} />
    );
}

function PrinterRow({ printer, onChange, onDelete }) {
    return (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
            <TextField label="Name" value={printer.name} onChange={e => onChange("name", e.target.value)} size="small" sx={{ width: 140 }} />
            <TextField label="IP Address" value={printer.ipAddress} onChange={e => onChange("ipAddress", e.target.value)} size="small" sx={{ flex: 1 }} placeholder="192.168.1.x" />
            <TextField label="Port" value={printer.port} onChange={e => onChange("port", e.target.value)} size="small" sx={{ width: 80 }} />
            <FormControl size="small" sx={{ width: 100 }}>
                <InputLabel>Format</InputLabel>
                <Select label="Format" value={printer.format ?? "ZPL"} onChange={e => onChange("format", e.target.value)}>
                    <MenuItem value="ZPL">ZPL</MenuItem>
                    <MenuItem value="PDF">PDF</MenuItem>
                </Select>
            </FormControl>
            <IconButton size="small" color="error" onClick={onDelete} sx={{ mt: 0.5 }}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
    );
}

function ScaleRow({ scale, onChange, onDelete }) {
    return (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
            <TextField label="Name" value={scale.name} onChange={e => onChange("name", e.target.value)} size="small" sx={{ width: 140 }} />
            <TextField label="IP Address" value={scale.ipAddress} onChange={e => onChange("ipAddress", e.target.value)} size="small" sx={{ flex: 1 }} placeholder="192.168.1.x" />
            <TextField label="Port" value={scale.port} onChange={e => onChange("port", e.target.value)} size="small" sx={{ width: 80 }} />
            <TextField label="Model" value={scale.model} onChange={e => onChange("model", e.target.value)} size="small" sx={{ width: 180 }} placeholder="e.g. Dymo M25" />
            <IconButton size="small" color="error" onClick={onDelete} sx={{ mt: 0.5 }}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
    );
}

const EMPTY = {
    localIP: "", localKey: "",
    businessAddress: { name: "", businessName: "", address1: "", address2: "", city: "", state: "", postalCode: "", country: "US", emailAddress: "", phone: "" },
    shipstation: { apiKey: "", apiSecret: "", v2Key: "" },
    usps: { clientId: "", clientSecret: "", accountNumber: "", crid: "", mid: "", manifestMid: "" },
    ups: { clientId: "", clientSecret: "", accountNumber: "" },
    endicia: { requesterId: "", accountNumber: "", passPhrase: "" },
    fedex: { accountNumber: "", meterNumber: "", key: "" },
    shippingLabelPrinters: [],
    productionLabelPrinters: [],
    scales: [],
};

export default function ShippingSettingsPage() {
    const { data: session } = useSession();
    const { org } = useOrg() ?? {};
    const base = org?.slug ? `/${org.slug}` : "";
    const [creds, setCreds] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        fetch("/api/settings/integrations")
            .then(r => r.json())
            .then(d => {
                if (d.creds) setCreds(c => deepMerge(c, d.creds));
                setLoading(false);
            });
    }, []);

    function deepMerge(base, override) {
        const out = { ...base };
        for (const k of Object.keys(override ?? {})) {
            if (override[k] && typeof override[k] === "object" && !Array.isArray(override[k])) {
                out[k] = deepMerge(base[k] ?? {}, override[k]);
            } else {
                out[k] = override[k] ?? base[k];
            }
        }
        return out;
    }

    function set(path) {
        return (e) => {
            const parts = path.split(".");
            setCreds(c => {
                const next = { ...c };
                let obj = next;
                for (let i = 0; i < parts.length - 1; i++) {
                    obj[parts[i]] = { ...obj[parts[i]] };
                    obj = obj[parts[i]];
                }
                obj[parts[parts.length - 1]] = e.target.value;
                return next;
            });
        };
    }

    function setArrayItem(key, idx, field, value) {
        setCreds(c => {
            const arr = [...(c[key] ?? [])];
            arr[idx] = { ...arr[idx], [field]: value };
            return { ...c, [key]: arr };
        });
    }

    function addArrayItem(key, template) {
        setCreds(c => ({ ...c, [key]: [...(c[key] ?? []), { ...template }] }));
    }

    function removeArrayItem(key, idx) {
        setCreds(c => ({ ...c, [key]: (c[key] ?? []).filter((_, i) => i !== idx) }));
    }

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/settings/integrations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(creds),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Shipping settings saved" });
        setSaving(false);
    }

    const isAdminOrOwner = session?.user?.role === "owner" || session?.user?.role === "admin";
    if (loading) return null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Shipping &amp; Hardware</Typography>
                        <Typography variant="body2" color="text.secondary">Internal server, warehouse address, carriers, printers, and scales</Typography>
                    </Box>
                    <Button href={`${base}/settings`} variant="outlined" size="small">← Back to settings</Button>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

                <form onSubmit={save}>
                    <Stack spacing={2}>

                        {/* ── Internal Server ─────────────────────────────── */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Internal Server</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        IP address and API key for your on-site Pythias Internal Server. Used to send DTF files, shipping labels, and communicate with floor stations.
                                    </Typography>
                                    <TextField label="Internal Server IP" value={creds.localIP} onChange={set("localIP")} fullWidth size="small"
                                        helperText="e.g. 192.168.1.50:3005" placeholder="0.0.0.0:3005" />
                                    <MaskedField label="Internal Server API Key" value={creds.localKey} onChange={set("localKey")}
                                        helperText="Bearer token from your internal server settings" />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Warehouse / Return Address ────────────────────── */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Warehouse / Return Address</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        This address is used as the origin on all outbound shipments and as the return address on labels.
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <TextField label="Contact name" value={creds.businessAddress.name} onChange={set("businessAddress.name")} fullWidth size="small" />
                                        <TextField label="Business name" value={creds.businessAddress.businessName} onChange={set("businessAddress.businessName")} fullWidth size="small" />
                                    </Stack>
                                    <TextField label="Address line 1" value={creds.businessAddress.address1} onChange={set("businessAddress.address1")} fullWidth size="small" />
                                    <TextField label="Address line 2 (suite/unit)" value={creds.businessAddress.address2} onChange={set("businessAddress.address2")} fullWidth size="small" />
                                    <Stack direction="row" spacing={1}>
                                        <TextField label="City" value={creds.businessAddress.city} onChange={set("businessAddress.city")} fullWidth size="small" />
                                        <TextField label="State" value={creds.businessAddress.state} onChange={set("businessAddress.state")} size="small" sx={{ width: 100 }} />
                                        <TextField label="ZIP" value={creds.businessAddress.postalCode} onChange={set("businessAddress.postalCode")} size="small" sx={{ width: 120 }} />
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        <TextField label="Country" value={creds.businessAddress.country} onChange={set("businessAddress.country")} size="small" sx={{ width: 100 }} />
                                        <TextField label="Email" type="email" value={creds.businessAddress.emailAddress} onChange={set("businessAddress.emailAddress")} fullWidth size="small" />
                                        <TextField label="Phone" value={creds.businessAddress.phone} onChange={set("businessAddress.phone")} fullWidth size="small" />
                                    </Stack>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── ShipStation ─────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>ShipStation</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <MaskedField label="API Key" value={creds.shipstation.apiKey} onChange={set("shipstation.apiKey")} />
                                    <MaskedField label="API Secret" value={creds.shipstation.apiSecret} onChange={set("shipstation.apiSecret")} />
                                    <MaskedField label="V2 Bearer Token" value={creds.shipstation.v2Key} onChange={set("shipstation.v2Key")}
                                        helperText="Account Settings → API Keys → V2 key" />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── USPS ─────────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>USPS</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <MaskedField label="Client ID" value={creds.usps.clientId} onChange={set("usps.clientId")} />
                                    <MaskedField label="Client Secret" value={creds.usps.clientSecret} onChange={set("usps.clientSecret")} />
                                    <TextField label="Account Number" value={creds.usps.accountNumber} onChange={set("usps.accountNumber")} fullWidth size="small" />
                                    <Stack direction="row" spacing={1}>
                                        <TextField label="CRID" value={creds.usps.crid} onChange={set("usps.crid")} fullWidth size="small" />
                                        <TextField label="MID" value={creds.usps.mid} onChange={set("usps.mid")} fullWidth size="small" />
                                        <TextField label="Manifest MID" value={creds.usps.manifestMid} onChange={set("usps.manifestMid")} fullWidth size="small" />
                                    </Stack>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── UPS ──────────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>UPS</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <MaskedField label="Client ID" value={creds.ups.clientId} onChange={set("ups.clientId")} />
                                    <MaskedField label="Client Secret" value={creds.ups.clientSecret} onChange={set("ups.clientSecret")} />
                                    <TextField label="Account Number" value={creds.ups.accountNumber} onChange={set("ups.accountNumber")} fullWidth size="small" />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Endicia ───────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Endicia / Stamps.com</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <TextField label="Requester ID" value={creds.endicia.requesterId} onChange={set("endicia.requesterId")} fullWidth size="small" />
                                    <TextField label="Account Number" value={creds.endicia.accountNumber} onChange={set("endicia.accountNumber")} fullWidth size="small" />
                                    <MaskedField label="Pass Phrase" value={creds.endicia.passPhrase} onChange={set("endicia.passPhrase")} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── FedEx ─────────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>FedEx</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <TextField label="Account Number" value={creds.fedex.accountNumber} onChange={set("fedex.accountNumber")} fullWidth size="small" />
                                    <TextField label="Meter Number" value={creds.fedex.meterNumber} onChange={set("fedex.meterNumber")} fullWidth size="small" />
                                    <MaskedField label="Key" value={creds.fedex.key} onChange={set("fedex.key")} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Printers ──────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Label Printers</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={3}>
                                    <Typography variant="caption" color="text.secondary">
                                        Compatible models: Zebra ZD421 / ZD621 (ZPL, direct IP), Rollo Label Printer (ZPL/PDF), DYMO LabelWriter 4XL (PDF, USB bridge), Munbyn ITPP941 (ZPL/PDF).
                                        Use ZPL for direct network printing; PDF for USB-only printers bridged via the internal server.
                                    </Typography>

                                    <Box>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Shipping Label Printers</Typography>
                                            <Button size="small" startIcon={<AddIcon />}
                                                onClick={() => addArrayItem("shippingLabelPrinters", { name: "", ipAddress: "", port: "9100", format: "ZPL" })}>
                                                Add
                                            </Button>
                                        </Stack>
                                        <Stack spacing={1}>
                                            {(creds.shippingLabelPrinters ?? []).map((p, i) => (
                                                <PrinterRow key={i} printer={p}
                                                    onChange={(f, v) => setArrayItem("shippingLabelPrinters", i, f, v)}
                                                    onDelete={() => removeArrayItem("shippingLabelPrinters", i)} />
                                            ))}
                                            {!creds.shippingLabelPrinters?.length && (
                                                <Typography variant="body2" color="text.secondary">No shipping label printers added.</Typography>
                                            )}
                                        </Stack>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="subtitle2" fontWeight={700}>Production / Pick Label Printers</Typography>
                                            <Button size="small" startIcon={<AddIcon />}
                                                onClick={() => addArrayItem("productionLabelPrinters", { name: "", ipAddress: "", port: "9100", format: "ZPL" })}>
                                                Add
                                            </Button>
                                        </Stack>
                                        <Stack spacing={1}>
                                            {(creds.productionLabelPrinters ?? []).map((p, i) => (
                                                <PrinterRow key={i} printer={p}
                                                    onChange={(f, v) => setArrayItem("productionLabelPrinters", i, f, v)}
                                                    onDelete={() => removeArrayItem("productionLabelPrinters", i)} />
                                            ))}
                                            {!creds.productionLabelPrinters?.length && (
                                                <Typography variant="body2" color="text.secondary">No production label printers added.</Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Scales ────────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Shipping Scales</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        Compatible scales (with USB-to-network bridge via internal server): Stamps.com 5 lb Digital Scale, Dymo M25 (25 lb), Fairbanks SCB-R9000, Adam Equipment CBD 4 Compact.
                                        The internal server reads the USB scale and exposes it on the configured port.
                                    </Typography>
                                    <Stack direction="row" justifyContent="flex-end">
                                        <Button size="small" startIcon={<AddIcon />}
                                            onClick={() => addArrayItem("scales", { name: "", ipAddress: "", port: "8080", model: "" })}>
                                            Add Scale
                                        </Button>
                                    </Stack>
                                    <Stack spacing={1}>
                                        {(creds.scales ?? []).map((s, i) => (
                                            <ScaleRow key={i} scale={s}
                                                onChange={(f, v) => setArrayItem("scales", i, f, v)}
                                                onDelete={() => removeArrayItem("scales", i)} />
                                        ))}
                                        {!creds.scales?.length && (
                                            <Typography variant="body2" color="text.secondary">No scales configured.</Typography>
                                        )}
                                    </Stack>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                    </Stack>

                    {isAdminOrOwner && (
                        <Box sx={{ mt: 3 }}>
                            <Button type="submit" variant="contained" size="large" disabled={saving} fullWidth>
                                {saving ? "Saving..." : "Save shipping settings"}
                            </Button>
                        </Box>
                    )}
                </form>
            </Container>
        </Box>
    );
}

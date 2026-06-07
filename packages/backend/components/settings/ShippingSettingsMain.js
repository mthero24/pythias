"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Box, Container, Typography, Stack, TextField, Button,
    Alert, Accordion, AccordionSummary, AccordionDetails, InputAdornment,
    IconButton, Select, MenuItem, FormControl, InputLabel, Divider, Chip,
    Switch, FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

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

function LabelPrinterRow({ printer, onChange, onDelete }) {
    const fmt = printer.format ?? "ZPL";
    return (
        <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center"
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 1 }}>
                <Chip label={printer.name} size="small" sx={{ fontWeight: 700, minWidth: 72, fontFamily: "monospace" }} />
                <FormControl size="small" sx={{ width: 100 }}>
                    <InputLabel>Format</InputLabel>
                    <Select label="Format" value={fmt} onChange={e => onChange("format", e.target.value)}>
                        <MenuItem value="ZPL">ZPL</MenuItem>
                        <MenuItem value="PDF">PDF</MenuItem>
                    </Select>
                </FormControl>
                {fmt === "ZPL" && (
                    <TextField label="ZPL Port" value={printer.port ?? "9100"} onChange={e => onChange("port", e.target.value)}
                        size="small" sx={{ width: 110 }} placeholder="9100" />
                )}
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" color="error" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
            {fmt === "ZPL" && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, ml: 0.5 }}>
                    TCP port (usually 9100)
                </Typography>
            )}
        </Box>
    );
}

function MachineList({ label, prefix, items, onAdd, onRemove }) {
    const nextName = `${prefix}${items.length + 1}`;
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>{label}</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {items.map((name, i) => (
                    <Chip key={i} label={name} size="small" onDelete={() => onRemove(i)} />
                ))}
                <Chip
                    label={`+ ${nextName}`}
                    size="small"
                    variant="outlined"
                    onClick={() => onAdd(nextName)}
                    sx={{ cursor: "pointer", borderStyle: "dashed" }}
                />
            </Stack>
        </Box>
    );
}

function StationList({ stations, onAdd, onRemove, onToggleScale, onUpdateStation, defaultFormat = "ZPL" }) {
    const nextName = `station${stations.length + 1}`;
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Shipping Stations</Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
                {stations.map((s, i) => {
                    const name = typeof s === "string" ? s : (s.name ?? "");
                    const hasScale = typeof s === "string" ? true : !!s.hasScale;
                    const fmt = typeof s === "string" ? defaultFormat : (s.format ?? defaultFormat);
                    return (
                        <Box key={i} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 0.75, minWidth: 150, position: "relative" }}>
                            <IconButton
                                size="small"
                                onClick={() => onRemove(i)}
                                sx={{ position: "absolute", top: 2, right: 2, p: 0.25 }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize", mb: 0.5, pr: 3 }}>
                                {name}
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch size="small" checked={hasScale} onChange={e => onToggleScale(i, e.target.checked)} />
                                }
                                label={<Typography variant="caption" color="text.secondary">Scale</Typography>}
                                sx={{ m: 0, mb: 0.5 }}
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel sx={{ fontSize: 11 }}>Format</InputLabel>
                                <Select
                                    label="Format"
                                    value={fmt}
                                    onChange={e => onUpdateStation(i, "format", e.target.value)}
                                    sx={{ fontSize: 12 }}
                                >
                                    <MenuItem value="ZPL">ZPL</MenuItem>
                                    <MenuItem value="PDF">PDF</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    );
                })}
                <Chip
                    label={`+ ${nextName}`}
                    size="small"
                    variant="outlined"
                    onClick={() => onAdd({ name: nextName, hasScale: false, format: defaultFormat })}
                    sx={{ cursor: "pointer", borderStyle: "dashed", alignSelf: "center" }}
                />
            </Stack>
        </Box>
    );
}

const EMPTY = {
    localIP: "", localKey: "",
    businessAddress: { name: "", businessName: "", address1: "", address2: "", city: "", state: "", postalCode: "", country: "US", emailAddress: "", phone: "" },
    shipstation: { apiKey: "", apiSecret: "", v2Key: "" },
    usps: { clientId: "", clientSecret: "", accountNumber: "", crid: "", mid: "", manifestMid: "" },
    ups: { clientId: "", clientSecret: "", accountNumber: "" },
    endicia: { requesterId: "", accountNumber: "", passPhrase: "" },
    fedex: { accountNumber: "", clientId: "", clientSecret: "" },
    dhl: { accountNumber: "", clientId: "", clientSecret: "" },
    productionLabelPrinters: [],
    picklistLabelPrinters: [],
    production: { shippingStations: [], dtfPrinters: [], gtxPrinters: [], roqFolders: [], sublimationMachines: [], embroideryMachines: [] },
};

export function ShippingSettingsMain({ defaultStationFormat = "ZPL" }) {
    const { data: session } = useSession();
    const [creds, setCreds] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
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

    function addToProduction(key, name) {
        setCreds(c => ({ ...c, production: { ...(c.production ?? {}), [key]: [...(c.production?.[key] ?? []), name] } }));
    }

    function removeFromProduction(key, idx) {
        setCreds(c => {
            const arr = [...(c.production?.[key] ?? [])];
            arr.splice(idx, 1);
            return { ...c, production: { ...(c.production ?? {}), [key]: arr } };
        });
    }

    function addStation(station) {
        setCreds(c => ({ ...c, production: { ...(c.production ?? {}), shippingStations: [...(c.production?.shippingStations ?? []), station] } }));
    }

    function removeStation(idx) {
        setCreds(c => {
            const arr = [...(c.production?.shippingStations ?? [])];
            arr.splice(idx, 1);
            return { ...c, production: { ...(c.production ?? {}), shippingStations: arr } };
        });
    }

    function toggleStationScale(idx, hasScale) {
        setCreds(c => {
            const arr = [...(c.production?.shippingStations ?? [])];
            arr[idx] = { ...arr[idx], hasScale };
            return { ...c, production: { ...(c.production ?? {}), shippingStations: arr } };
        });
    }

    function updateStation(idx, field, value) {
        setCreds(c => {
            const arr = [...(c.production?.shippingStations ?? [])];
            arr[idx] = { ...arr[idx], [field]: value };
            return { ...c, production: { ...(c.production ?? {}), shippingStations: arr } };
        });
    }

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/admin/settings/integrations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(creds),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Shipping settings saved" });
        setSaving(false);
    }

    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "manager";
    if (loading) return null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Shipping &amp; Hardware</Typography>
                        <Typography variant="body2" color="text.secondary">Internal server, warehouse address, carriers, printers, and scales</Typography>
                    </Box>
                    <Button href="./shipping/guide" variant="outlined" size="small">Setup Guide →</Button>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

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
                                    <MaskedField label="Client ID" value={creds.fedex.clientId} onChange={set("fedex.clientId")} />
                                    <MaskedField label="Client Secret" value={creds.fedex.clientSecret} onChange={set("fedex.clientSecret")} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── DHL ───────────────────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>DHL</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <TextField label="Account Number" value={creds.dhl?.accountNumber ?? ""} onChange={set("dhl.accountNumber")} fullWidth size="small" />
                                    <MaskedField label="Client ID" value={creds.dhl?.clientId ?? ""} onChange={set("dhl.clientId")} />
                                    <MaskedField label="Client Secret" value={creds.dhl?.clientSecret ?? ""} onChange={set("dhl.clientSecret")} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Pick / Production Label Printers ─────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Pick / Production Label Printers</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        Printers are automatically named <strong>printer1</strong>, <strong>printer2</strong>, etc. — matching the printer IDs used on the production floor.
                                        Choose ZPL for direct-network Zebra printers and enter the TCP port (usually 9100). Choose PDF for USB or shared printers handled by the internal server.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {(creds.productionLabelPrinters ?? []).map((p, i) => (
                                            <LabelPrinterRow key={i} printer={p}
                                                onChange={(f, v) => setArrayItem("productionLabelPrinters", i, f, v)}
                                                onDelete={() => removeArrayItem("productionLabelPrinters", i)} />
                                        ))}
                                    </Stack>
                                    <Box>
                                        <Button size="small" startIcon={<AddIcon />} variant="outlined"
                                            onClick={() => addArrayItem("productionLabelPrinters", {
                                                name: `printer${(creds.productionLabelPrinters?.length ?? 0) + 1}`,
                                                format: "ZPL",
                                                port: "9100",
                                            })}>
                                            Add Printer
                                        </Button>
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Picklist Printer ─────────────────────────────── */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Picklist Printer</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Typography variant="caption" color="text.secondary">
                                        Printer(s) used for PDF pick lists on bulk orders. Kept separate from production label printers.
                                        Pick lists always print as full-page PDFs, so PDF format is recommended.
                                    </Typography>
                                    <Stack spacing={1}>
                                        {(creds.picklistLabelPrinters ?? []).map((p, i) => (
                                            <LabelPrinterRow key={i} printer={p}
                                                onChange={(f, v) => setArrayItem("picklistLabelPrinters", i, f, v)}
                                                onDelete={() => removeArrayItem("picklistLabelPrinters", i)} />
                                        ))}
                                    </Stack>
                                    <Box>
                                        <Button size="small" startIcon={<AddIcon />} variant="outlined"
                                            onClick={() => addArrayItem("picklistLabelPrinters", {
                                                name: `printer${(creds.picklistLabelPrinters?.length ?? 0) + 1}`,
                                                format: "PDF",
                                                port: "9100",
                                            })}>
                                            Add Picklist Printer
                                        </Button>
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        {/* ── Production Machines ────────────────────────────── */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={700}>Production Machines</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={3}>
                                    <Typography variant="caption" color="text.secondary">
                                        Names must match the station/printer IDs configured in your internal server&apos;s <strong>fwSettings.json</strong>. These names appear as selectable options on the production floor screens.
                                    </Typography>

                                    <StationList
                                        stations={creds.production?.shippingStations ?? []}
                                        onAdd={addStation}
                                        onRemove={removeStation}
                                        onToggleScale={toggleStationScale}
                                        onUpdateStation={updateStation}
                                        defaultFormat={defaultStationFormat}
                                    />

                                    <Divider />

                                    <MachineList label="DTF Printers" prefix="printer"
                                        items={creds.production?.dtfPrinters ?? []}
                                        onAdd={n => addToProduction("dtfPrinters", n)}
                                        onRemove={i => removeFromProduction("dtfPrinters", i)} />

                                    <Divider />

                                    <MachineList label="GTX / DTG Printers" prefix="printer"
                                        items={creds.production?.gtxPrinters ?? []}
                                        onAdd={n => addToProduction("gtxPrinters", n)}
                                        onRemove={i => removeFromProduction("gtxPrinters", i)} />

                                    <Divider />

                                    <MachineList label="ROQ Folders" prefix="roq"
                                        items={creds.production?.roqFolders ?? []}
                                        onAdd={n => addToProduction("roqFolders", n)}
                                        onRemove={i => removeFromProduction("roqFolders", i)} />

                                    <Divider />

                                    <MachineList label="Sublimation Machines" prefix="printer"
                                        items={creds.production?.sublimationMachines ?? []}
                                        onAdd={n => addToProduction("sublimationMachines", n)}
                                        onRemove={i => removeFromProduction("sublimationMachines", i)} />

                                    <Divider />

                                    <MachineList label="Embroidery Machines" prefix="machine"
                                        items={creds.production?.embroideryMachines ?? []}
                                        onAdd={n => addToProduction("embroideryMachines", n)}
                                        onRemove={i => removeFromProduction("embroideryMachines", i)} />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                    </Stack>

                    {isAdmin && (
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

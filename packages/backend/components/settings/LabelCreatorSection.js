"use client";
import {
    Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
    Chip, Divider, Switch, FormControlLabel, Paper, Accordion,
    AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";

export { PREMIER_DEFAULT_FIELDS, LABEL_TEMPLATE_DEFAULT } from "../../lib/labelConstants.js";
import { PREMIER_DEFAULT_FIELDS, LABEL_TEMPLATE_DEFAULT } from "../../lib/labelConstants.js";

const LABEL_SIZES = [
    { label: '2×2" (Recommended)', width: 2, height: 2 },
    { label: '2×3"', width: 2, height: 3 },
    { label: '3×2"', width: 3, height: 2 },
    { label: '4×2"', width: 4, height: 2 },
    { label: '4×6"', width: 4, height: 6 },
];

const OPTIONAL_FIELDS = [
    { key: "itemNumber",     label: "Item Number",        hint: "#1, #2…" },
    { key: "styleCode",      label: "Style Code",         hint: "Blank style code" },
    { key: "shipByDate",     label: "Ship By Date",       hint: "" },
    { key: "inventoryLoc",   label: "Inventory Location", hint: "Aisle / Unit / Shelf / Bin" },
    { key: "color",          label: "Color",              hint: "" },
    { key: "size",           label: "Size",               hint: "" },
    { key: "shippingType",   label: "Shipping Type",      hint: "Standard / Expedited" },
    { key: "designSku",      label: "Design SKU",         hint: "" },
    { key: "orderCount",     label: "Order Count",        hint: "Total items in order" },
    { key: "designName",     label: "Design Name",        hint: "" },
    { key: "printType",      label: "Print Type",         hint: "DTF, Embroidery…" },
    { key: "printLocations", label: "Print Locations",    hint: "Front / Back" },
    { key: "blankCode",      label: "Blank Code",         hint: "" },
    { key: "orderDate",      label: "Order Date",         hint: "" },
];


function LabelPreview({ width, height, enabledFields }) {
    const previewW = 200;
    const previewH = Math.round((height / width) * previewW);
    const rows = OPTIONAL_FIELDS.filter(f => enabledFields.includes(f.key));

    return (
        <Paper variant="outlined" sx={{
            width: previewW, height: previewH,
            p: 1, boxSizing: "border-box",
            overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
            {/* Fixed top */}
            <Box sx={{ pb: 0.5, mb: 0.5, borderBottom: "1px dashed", borderColor: "divider" }}>
                {[["PO#", "always top"], ["Piece", "always top"]].map(([label]) => (
                    <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
                        <LockIcon sx={{ fontSize: 8, color: "text.disabled" }} />
                        <Typography sx={{ fontSize: 7, fontFamily: "monospace", color: "text.secondary" }}>
                            {label} ———
                        </Typography>
                    </Stack>
                ))}
            </Box>

            {/* Barcode */}
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1px", my: 0.5 }}>
                <LockIcon sx={{ fontSize: 8, color: "text.disabled", mr: 0.5 }} />
                {Array.from({ length: 22 }).map((_, i) => (
                    <Box key={i} sx={{ width: i % 3 === 0 ? 2 : 1, height: 22, bgcolor: "text.primary", opacity: 0.65 }} />
                ))}
            </Box>

            {/* Optional fields */}
            {rows.length > 0 && (
                <Box sx={{ pt: 0.5, borderTop: "1px dashed", borderColor: "divider", flex: 1, overflow: "hidden" }}>
                    {rows.map(f => (
                        <Typography key={f.key} sx={{ fontSize: 6.5, fontFamily: "monospace", color: "text.secondary", lineHeight: 1.55 }}>
                            {f.label}: ———
                        </Typography>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

export function LabelCreatorSection({ value, onChange }) {
    const template = { ...LABEL_TEMPLATE_DEFAULT, ...(value ?? {}) };

    function set(key, val) {
        onChange({ ...template, [key]: val });
    }

    function toggleField(key) {
        const fields = template.fields ?? [];
        set("fields", fields.includes(key) ? fields.filter(k => k !== key) : [...fields, key]);
    }

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>Label Creator</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={3}>
                    <Typography variant="caption" color="text.secondary">
                        Configure the layout for production pick labels. PO number, piece ID, and barcode are always printed — everything else is optional. The default layout matches Premier&apos;s current label.
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">

                        {/* ── Controls ── */}
                        <Stack spacing={2} sx={{ flex: 1 }}>

                            <FormControl size="small" fullWidth>
                                <InputLabel>Label Size</InputLabel>
                                <Select
                                    label="Label Size"
                                    value={`${template.width}x${template.height}`}
                                    onChange={e => {
                                        const sz = LABEL_SIZES.find(s => `${s.width}x${s.height}` === e.target.value) ?? LABEL_SIZES[0];
                                        onChange({ ...template, width: sz.width, height: sz.height });
                                    }}
                                >
                                    {LABEL_SIZES.map(s => (
                                        <MenuItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                                            {s.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" fullWidth>
                                <InputLabel>Output Format</InputLabel>
                                <Select label="Output Format" value={template.format} onChange={e => set("format", e.target.value)}>
                                    <MenuItem value="ZPL">ZPL (Zebra direct)</MenuItem>
                                    <MenuItem value="PDF">PDF</MenuItem>
                                </Select>
                            </FormControl>

                            <Divider />

                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Fixed Fields</Typography>
                                <Stack spacing={0.75}>
                                    {[
                                        { label: "PO Number",  hint: "always at top" },
                                        { label: "Piece ID",   hint: "always at top" },
                                        { label: "Barcode",    hint: "always in center" },
                                    ].map(f => (
                                        <Stack key={f.label} direction="row" alignItems="center" spacing={1}>
                                            <LockIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                            <Typography variant="body2">{f.label}</Typography>
                                            <Typography variant="caption" color="text.disabled">({f.hint})</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Optional Fields</Typography>
                                <Stack spacing={0.25}>
                                    {OPTIONAL_FIELDS.map(f => (
                                        <FormControlLabel
                                            key={f.key}
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={(template.fields ?? []).includes(f.key)}
                                                    onChange={() => toggleField(f.key)}
                                                />
                                            }
                                            label={
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <Typography variant="body2">{f.label}</Typography>
                                                    {f.hint && (
                                                        <Typography variant="caption" color="text.disabled">{f.hint}</Typography>
                                                    )}
                                                </Stack>
                                            }
                                            sx={{ m: 0 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>

                        {/* ── Preview ── */}
                        <Box sx={{ flexShrink: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Preview</Typography>
                            <LabelPreview
                                width={template.width}
                                height={template.height}
                                enabledFields={template.fields ?? PREMIER_DEFAULT_FIELDS}
                            />
                            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
                                {template.width}×{template.height}&quot; · {template.format}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
}

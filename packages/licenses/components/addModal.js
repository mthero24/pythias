"use client";
import {
    Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Grid2, TextField, Stack, IconButton, Box,
} from "@mui/material";
import CreatableSelect from "react-select/creatable";
import { useState, useEffect } from "react";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import CardMembershipIcon from "@mui/icons-material/CardMembership";

const selectMenuPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
};

const PAYMENT_OPTIONS = [
    { label: "One Time Payment",    value: "One Time" },
    { label: "Flat Rate Per Unit",  value: "Flat Per Unit" },
    { label: "Percentage Per Unit", value: "Percentage Per Unit" },
];

const BLANK = { name: "", licenseType: "", paymentType: null, amount: 0, additionalFees: 0 };

const FieldLabel = ({ children }) => (
    <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
        {children}
    </Typography>
);

export function AddModal({ open, setOpen, li, setLi, setLicenses }) {
    const [license, setLicense] = useState(li ?? BLANK);

    useEffect(() => {
        setLicense(li ?? BLANK);
    }, [li, open]);

    const set = (key, value) => setLicense(prev => ({ ...prev, [key]: value }));

    const save = async () => {
        const res = await axios.post("/api/admin/license", { license });
        if (res.data.error) alert(res.data.msg);
        else {
            setLicense(BLANK);
            setLi(null);
            setOpen(false);
            setLicenses(res.data.licenses);
        }
    };

    const close = () => { setOpen(false); setLi(null); };
    const isEdit = !!li;

    return (
        <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CardMembershipIcon sx={{ color: "primary.main" }} />
                    <span>{isEdit ? "Edit License" : "Create License"}</span>
                </Stack>
                <IconButton size="small" onClick={close}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Grid2 container spacing={2.5} sx={{ pt: 0.5 }}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <FieldLabel>License Holder Name</FieldLabel>
                        <TextField
                            fullWidth size="small"
                            placeholder="e.g. Marvel, Disney"
                            value={license.name ?? ""}
                            onChange={(e) => set("name", e.target.value)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, sm: 6 }}>
                        <FieldLabel>License Type</FieldLabel>
                        <TextField
                            fullWidth size="small"
                            placeholder="e.g. Exclusive, Non-Exclusive"
                            value={license.licenseType ?? ""}
                            onChange={(e) => set("licenseType", e.target.value)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 12, sm: 4 }}>
                        <FieldLabel>Payment Type</FieldLabel>
                        <CreatableSelect
                            {...selectMenuPortalProps}
                            placeholder="Select payment type"
                            options={PAYMENT_OPTIONS}
                            value={PAYMENT_OPTIONS.find(o => o.value === license.paymentType) ?? null}
                            onChange={(val) => set("paymentType", val?.value ?? null)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <FieldLabel>
                            Payment Amount{license.paymentType === "Percentage Per Unit" ? " (%)" : " ($)"}
                        </FieldLabel>
                        <TextField
                            fullWidth size="small" type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            value={license.amount ?? 0}
                            onChange={(e) => set("amount", e.target.value)}
                        />
                    </Grid2>

                    <Grid2 size={{ xs: 6, sm: 4 }}>
                        <FieldLabel>Additional Retail ($)</FieldLabel>
                        <TextField
                            fullWidth size="small" type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            value={license.additionalFees ?? 0}
                            onChange={(e) => set("additionalFees", e.target.value)}
                        />
                    </Grid2>
                </Grid2>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={close}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={!license.name?.trim()}>
                    {isEdit ? "Save Changes" : "Create License"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

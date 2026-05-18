"use client";
import {
    Box, Container, Card, CardContent, Typography, Avatar, Button,
    TextField, Stack, Chip, Divider, CircularProgress, Snackbar, Alert,
    Tooltip, IconButton,
} from "@mui/material";
import { useState, useRef } from "react";
import EditIcon from "@mui/icons-material/Edit";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";

const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#10b981", "#f97316",
    "#ec4899", "#ef4444", "#14b8a6", "#f59e0b",
    "#06b6d4", "#8b5cf6", "#84cc16", "#64748b",
];

function getAvatarProps(avatar, initials) {
    if (!avatar) return { sx: { bgcolor: "#6366f1" }, children: initials };
    if (avatar.startsWith("http")) return { src: avatar, children: initials };
    return { sx: { bgcolor: avatar }, children: initials };
}

function userInitials(user) {
    if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user.firstName) return user.firstName[0].toUpperCase();
    return (user.userName?.[0] ?? "?").toUpperCase();
}

export function Main({ user }) {
    const [firstName, setFirstName]   = useState(user.firstName ?? "");
    const [lastName, setLastName]     = useState(user.lastName ?? "");
    const [avatar, setAvatar]         = useState(user.avatar ?? "");
    const [saving, setSaving]         = useState(false);
    const [uploading, setUploading]   = useState(false);
    const [snack, setSnack]           = useState(null);
    const [editing, setEditing]       = useState(false);
    const fileRef = useRef();

    const initials = userInitials({ firstName, lastName, userName: user.userName });
    const avatarProps = getAvatarProps(avatar, initials);

    const save = async () => {
        setSaving(true);
        try {
            await axios.put("/api/account", { firstName, lastName, avatar });
            setSnack({ severity: "success", msg: "Profile saved!" });
            setEditing(false);
        } catch {
            setSnack({ severity: "error", msg: "Failed to save" });
        }
        setSaving(false);
    };

    const pickColor = async (color) => {
        setAvatar(color);
        try {
            await axios.put("/api/account", { avatar: color });
            setSnack({ severity: "success", msg: "Avatar updated" });
        } catch {
            setSnack({ severity: "error", msg: "Failed to update avatar" });
        }
    };

    const uploadPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await axios.post("/api/messages/upload", form);
            if (res.data.error) throw new Error(res.data.msg);
            const url = res.data.url;
            setAvatar(url);
            await axios.put("/api/account", { avatar: url });
            setSnack({ severity: "success", msg: "Photo uploaded!" });
        } catch {
            setSnack({ severity: "error", msg: "Upload failed" });
        }
        setUploading(false);
    };

    const [pwForm, setPwForm]     = useState({ current: "", next: "", confirm: "" });
    const [pwSaving, setPwSaving] = useState(false);

    const setPw = (key) => (e) => setPwForm(p => ({ ...p, [key]: e.target.value }));

    const changePassword = async () => {
        if (!pwForm.current || !pwForm.next) return setSnack({ severity: "error", msg: "All password fields are required." });
        if (pwForm.next !== pwForm.confirm) return setSnack({ severity: "error", msg: "New passwords do not match." });
        if (pwForm.next.length < 6) return setSnack({ severity: "error", msg: "New password must be at least 6 characters." });
        setPwSaving(true);
        try {
            const res = await axios.put("/api/account", { currentPassword: pwForm.current, newPassword: pwForm.next });
            if (res.data.error) throw new Error(res.data.msg ?? "Failed");
            setSnack({ severity: "success", msg: "Password updated!" });
            setPwForm({ current: "", next: "", confirm: "" });
        } catch (err) {
            setSnack({ severity: "error", msg: err.response?.data?.msg ?? "Incorrect current password." });
        }
        setPwSaving(false);
    };

    const roleColor = { admin: "error", manager: "warning", production: "primary" };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            {/* Header banner */}
            <Box sx={{
                background: "linear-gradient(135deg, #1a1f2e 0%, #111827 60%, #0f172a 100%)",
                height: 160,
                position: "relative",
            }}>
                <Box sx={{
                    position: "absolute", top: -60, right: -60,
                    width: 300, height: 300, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
            </Box>

            <Container maxWidth="md" sx={{ pb: 6 }}>
                {/* Avatar + name floating over banner */}
                <Box sx={{ position: "relative", mt: -6, mb: 3 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "center", sm: "flex-end" }} spacing={2}>
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                            <Avatar
                                {...avatarProps}
                                sx={{ width: 96, height: 96, fontSize: "2rem", fontWeight: 800, border: "4px solid #fff", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", ...avatarProps.sx }}
                            />
                            <Tooltip title={uploading ? "Uploading…" : "Upload photo"}>
                                <IconButton
                                    size="small"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                    sx={{
                                        position: "absolute", bottom: 0, right: 0,
                                        bgcolor: "#fff", border: "2px solid #e5e7eb",
                                        width: 28, height: 28,
                                        "&:hover": { bgcolor: "#f3f4f6" },
                                    }}
                                >
                                    {uploading
                                        ? <CircularProgress size={14} />
                                        : <CameraAltIcon sx={{ fontSize: 14, color: "#374151" }} />}
                                </IconButton>
                            </Tooltip>
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadPhoto} />
                        </Box>

                        <Box sx={{ pt: 1.5, pb: 0.5, textAlign: { xs: "center", sm: "left" } }}>
                            <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 800, lineHeight: 1.2 }}>
                                {firstName || lastName ? `${firstName} ${lastName}`.trim() : user.userName}
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent={{ xs: "center", sm: "flex-start" }} sx={{ mt: 0.75 }}>
                                <Chip label={`@${user.userName}`} size="small" sx={{ bgcolor: "#f3f4f6", color: "text.secondary", border: "none", fontSize: "0.72rem" }} />
                                <Chip label={user.role ?? "production"} size="small" color={roleColor[user.role] ?? "default"} />
                            </Stack>
                        </Box>
                    </Stack>
                </Box>

                <Stack spacing={3}>
                    {/* Avatar color picker */}
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Avatar Color</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                                Pick a color or upload a photo above.
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1.25}>
                                {PRESET_COLORS.map(c => (
                                    <Tooltip key={c} title={c}>
                                        <Box
                                            onClick={() => pickColor(c)}
                                            sx={{
                                                width: 36, height: 36, borderRadius: "50%",
                                                bgcolor: c,
                                                cursor: "pointer",
                                                border: avatar === c ? "3px solid #111" : "3px solid transparent",
                                                outline: avatar === c ? `2px solid ${c}` : "none",
                                                outlineOffset: 2,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "transform 100ms",
                                                "&:hover": { transform: "scale(1.12)" },
                                            }}
                                        >
                                            {avatar === c && <CheckIcon sx={{ fontSize: 16, color: "#fff" }} />}
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Profile info */}
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Profile</Typography>
                                {!editing && (
                                    <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                                        Edit
                                    </Button>
                                )}
                            </Stack>
                            <Divider sx={{ mb: 2.5 }} />

                            <Stack spacing={2.5}>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                    <TextField
                                        label="First name"
                                        fullWidth
                                        size="small"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        disabled={!editing}
                                    />
                                    <TextField
                                        label="Last name"
                                        fullWidth
                                        size="small"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        disabled={!editing}
                                    />
                                </Stack>

                                <TextField
                                    label="Username"
                                    fullWidth
                                    size="small"
                                    value={user.userName}
                                    disabled
                                    helperText="Username cannot be changed"
                                />

                                {user.email && (
                                    <TextField
                                        label="Email"
                                        fullWidth
                                        size="small"
                                        value={user.email}
                                        disabled
                                    />
                                )}

                                {editing && (
                                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                        <Button variant="outlined" size="small" onClick={() => {
                                            setFirstName(user.firstName ?? "");
                                            setLastName(user.lastName ?? "");
                                            setEditing(false);
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button variant="contained" size="small" onClick={save} disabled={saving}>
                                            {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Save changes"}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                    {/* Change password */}
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Change Password</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                                Enter your current password to set a new one.
                            </Typography>
                            <Divider sx={{ mb: 2.5 }} />
                            <Stack spacing={2}>
                                <TextField
                                    label="Current password"
                                    type="password"
                                    fullWidth size="small"
                                    value={pwForm.current}
                                    onChange={setPw("current")}
                                    autoComplete="current-password"
                                />
                                <TextField
                                    label="New password"
                                    type="password"
                                    fullWidth size="small"
                                    value={pwForm.next}
                                    onChange={setPw("next")}
                                    autoComplete="new-password"
                                />
                                <TextField
                                    label="Confirm new password"
                                    type="password"
                                    fullWidth size="small"
                                    value={pwForm.confirm}
                                    onChange={setPw("confirm")}
                                    autoComplete="new-password"
                                />
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Button
                                        variant="contained" size="small"
                                        onClick={changePassword}
                                        disabled={pwSaving}
                                    >
                                        {pwSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Update password"}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Container>

            <Snackbar
                open={!!snack}
                autoHideDuration={3000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack?.severity ?? "info"} variant="filled" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

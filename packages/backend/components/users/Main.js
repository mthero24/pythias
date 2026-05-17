"use client";
import {
    Box, Typography, Container, Stack, Card, Avatar,
    Chip, IconButton, Collapse, Divider, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Grid2, Tooltip,
} from "@mui/material";
import PeopleIcon           from "@mui/icons-material/People";
import PersonAddIcon        from "@mui/icons-material/PersonAdd";
import KeyIcon              from "@mui/icons-material/Key";
import DeleteIcon           from "@mui/icons-material/Delete";
import ExpandMoreIcon       from "@mui/icons-material/ExpandMore";
import ExpandLessIcon       from "@mui/icons-material/ExpandLess";
import CloseIcon            from "@mui/icons-material/Close";
import Visibility           from "@mui/icons-material/Visibility";
import VisibilityOff        from "@mui/icons-material/VisibilityOff";
import BarChartIcon         from "@mui/icons-material/BarChart";
import AppRegistrationIcon  from "@mui/icons-material/AppRegistration";
import CardMembershipIcon   from "@mui/icons-material/CardMembership";
import InventoryIcon        from "@mui/icons-material/Inventory";
import PaletteIcon          from "@mui/icons-material/Palette";
import CheckroomIcon        from "@mui/icons-material/Checkroom";
import BrushIcon            from "@mui/icons-material/Brush";
import StorefrontIcon       from "@mui/icons-material/Storefront";
import QrCode2Icon          from "@mui/icons-material/QrCode2";
import ShoppingCartIcon     from "@mui/icons-material/ShoppingCart";
import PrintIcon            from "@mui/icons-material/Print";
import SyncAltIcon          from "@mui/icons-material/SyncAlt";
import ManageAccountsIcon   from "@mui/icons-material/ManageAccounts";
import { useState } from "react";
import axios from "axios";

const PERMISSIONS = [
    { key: "charts",       label: "Charts",       icon: <BarChartIcon sx={{ fontSize: 14 }} /> },
    { key: "register",     label: "Register",     icon: <AppRegistrationIcon sx={{ fontSize: 14 }} /> },
    { key: "licenses",     label: "Licenses",     icon: <CardMembershipIcon sx={{ fontSize: 14 }} /> },
    { key: "inventory",    label: "Inventory",    icon: <InventoryIcon sx={{ fontSize: 14 }} /> },
    { key: "colors",       label: "Colors",       icon: <PaletteIcon sx={{ fontSize: 14 }} /> },
    { key: "blanks",       label: "Blanks",       icon: <CheckroomIcon sx={{ fontSize: 14 }} /> },
    { key: "designs",      label: "Designs",      icon: <BrushIcon sx={{ fontSize: 14 }} /> },
    { key: "products",     label: "Products",     icon: <StorefrontIcon sx={{ fontSize: 14 }} /> },
    { key: "users",        label: "Users",        icon: <PeopleIcon sx={{ fontSize: 14 }} /> },
    { key: "marketplaces", label: "Marketplaces", icon: <StorefrontIcon sx={{ fontSize: 14 }} /> },
    { key: "upc",          label: "Fix UPC",      icon: <QrCode2Icon sx={{ fontSize: 14 }} /> },
    { key: "orders",       label: "Orders",       icon: <ShoppingCartIcon sx={{ fontSize: 14 }} /> },
    { key: "production",   label: "Production",   icon: <PrintIcon sx={{ fontSize: 14 }} /> },
    { key: "integrations", label: "Integrations", icon: <SyncAltIcon sx={{ fontSize: 14 }} /> },
];

const BLANK_USER = { userName: "", password: "", email: "", firstName: "", lastName: "", permissions: {} };

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#f97316"];

function avatarColor(str = "") {
    let h = 0;
    for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function isOnline(lastSeen) {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function UserAvatar({ u, size = 44 }) {
    const color = avatarColor(u.userName);
    const online = isOnline(u.lastSeen);
    const hasPhoto = u.avatar?.startsWith("http");
    const hasColor = u.avatar?.startsWith("#");
    return (
        <Box sx={{ position: "relative", flexShrink: 0, width: size, height: size }}>
            <Avatar
                src={hasPhoto ? u.avatar : undefined}
                sx={{
                    bgcolor: hasColor ? u.avatar : hasPhoto ? undefined : color,
                    width: size, height: size,
                    fontSize: size > 36 ? "1rem" : "0.75rem",
                    fontWeight: 800,
                    boxShadow: `0 0 0 3px ${hasColor ? u.avatar : color}22`,
                }}
            >
                {!hasPhoto && initials(u)}
            </Avatar>
            <Box sx={{
                position: "absolute", bottom: 0, right: 0,
                width: 11, height: 11, borderRadius: "50%",
                bgcolor: online ? "#22c55e" : "#9ca3af",
                border: "2px solid #fff",
            }} />
        </Box>
    );
}

function initials(u) {
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    return (u.userName?.[0] ?? "?").toUpperCase();
}

function displayName(u) {
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return u.userName;
}

function permCount(u) {
    return Object.values(u.permissions ?? {}).filter(Boolean).length;
}

function PermGrid({ permissions, onToggle }) {
    return (
        <Grid2 container spacing={1}>
            {PERMISSIONS.map(p => {
                const active = !!permissions?.[p.key];
                return (
                    <Grid2 key={p.key} size={{ xs: 6, sm: 4, md: 3 }}>
                        <Box
                            onClick={() => onToggle(p.key, !active)}
                            sx={{
                                display: "flex", alignItems: "center", gap: 1,
                                px: 1.25, py: 0.9,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: active ? "primary.main" : "divider",
                                backgroundColor: active ? "primary.main" : "#fff",
                                color: active ? "#fff" : "text.secondary",
                                cursor: "pointer",
                                userSelect: "none",
                                transition: "all 140ms",
                                "&:hover": {
                                    borderColor: "primary.main",
                                    backgroundColor: active ? "primary.dark" : "rgba(99,102,241,0.06)",
                                    color: active ? "#fff" : "primary.main",
                                },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, opacity: active ? 1 : 0.6 }}>
                                {p.icon}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: active ? 600 : 500, fontSize: "0.75rem", lineHeight: 1.2 }}>
                                {p.label}
                            </Typography>
                        </Box>
                    </Grid2>
                );
            })}
        </Grid2>
    );
}

export function Main({ user }) {
    const [users, setUsers]           = useState(user);
    const [opened, setOpened]         = useState("");
    const [delUser, setDelUser]       = useState(null);
    const [resetUser, setResetUser]   = useState(null);
    const [createOpen, setCreateOpen] = useState(false);

    const updatePermissions = async (u, key, value) => {
        const updated = { ...u, permissions: { ...(u.permissions ?? {}), [key]: value } };
        const res = await axios.put("/api/users", { user: updated });
        if (res.data.error) alert(res.data.msg);
        else setUsers(res.data.users);
    };

    const totalPerms = users.reduce((acc, u) => acc + permCount(u), 0);

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PeopleIcon sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>Users</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 6.25 }}>
                            {users.length} account{users.length !== 1 ? "s" : ""} · {totalPerms} total permissions granted
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: 0.5 }}>
                        Add User
                    </Button>
                </Box>

                {/* User list */}
                <Stack spacing={1.5}>
                    {users.length === 0 && (
                        <Card variant="outlined" sx={{ borderRadius: 3 }}>
                            <Box sx={{ py: 10, textAlign: "center" }}>
                                <ManageAccountsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                <Typography variant="body1" fontWeight={600} color="text.secondary">No users yet</Typography>
                                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Add a user to get started</Typography>
                                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}>
                                    Add User
                                </Button>
                            </Box>
                        </Card>
                    )}

                    {users.map(u => {
                        const isOpen = opened === u._id;
                        const count  = permCount(u);
                        const color  = avatarColor(u.userName);
                        const name   = displayName(u);
                        // color still used for permission chip/icon tinting
                        const activePerms = PERMISSIONS.filter(p => u.permissions?.[p.key]);

                        return (
                            <Card key={u._id} variant="outlined" sx={{
                                borderRadius: 2.5,
                                transition: "box-shadow 150ms, border-color 150ms",
                                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderColor: "rgba(99,102,241,0.3)" },
                                ...(isOpen && { borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }),
                            }}>
                                {/* Collapsed row */}
                                <Box
                                    sx={{ display: "flex", alignItems: "center", px: 2.5, py: 2, gap: 2, cursor: "pointer" }}
                                    onClick={() => setOpened(isOpen ? "" : u._id)}
                                >
                                    <UserAvatar u={u} size={44} />

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
                                            {name !== u.userName && (
                                                <Typography variant="caption" color="text.disabled">@{u.userName}</Typography>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {u.email}
                                        </Typography>
                                    </Box>

                                    {/* Permission preview chips */}
                                    <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}>
                                        {activePerms.slice(0, 3).map(p => (
                                            <Tooltip key={p.key} title={p.label} arrow>
                                                <Box sx={{
                                                    width: 26, height: 26, borderRadius: 1.5,
                                                    backgroundColor: `${color}18`,
                                                    color: color,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    {p.icon}
                                                </Box>
                                            </Tooltip>
                                        ))}
                                        {activePerms.length > 3 && (
                                            <Box sx={{
                                                width: 26, height: 26, borderRadius: 1.5,
                                                backgroundColor: "rgba(0,0,0,0.05)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary" }}>
                                                    +{activePerms.length - 3}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Stack>

                                    <Chip
                                        label={count === 0 ? "No access" : `${count} permission${count !== 1 ? "s" : ""}`}
                                        size="small"
                                        variant={count > 0 ? "filled" : "outlined"}
                                        sx={{
                                            display: { xs: "none", sm: "flex" },
                                            flexShrink: 0,
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            backgroundColor: count > 0 ? `${color}18` : undefined,
                                            color: count > 0 ? color : "text.disabled",
                                            borderColor: count > 0 ? `${color}40` : undefined,
                                        }}
                                    />

                                    <IconButton
                                        size="small"
                                        sx={{ flexShrink: 0, color: "text.secondary" }}
                                        onClick={(e) => { e.stopPropagation(); setOpened(isOpen ? "" : u._id); }}
                                    >
                                        {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                    </IconButton>
                                </Box>

                                {/* Expanded */}
                                <Collapse in={isOpen} unmountOnExit>
                                    <Divider />
                                    <Box sx={{ px: 2.5, pt: 2.5, pb: 2, backgroundColor: "#fafbff" }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "text.disabled", display: "block", mb: 1.5 }}>
                                            Access Permissions
                                        </Typography>
                                        <PermGrid
                                            permissions={u.permissions}
                                            onToggle={(key, value) => updatePermissions(u, key, value)}
                                        />
                                        <Divider sx={{ my: 2 }} />
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="outlined" startIcon={<KeyIcon />} onClick={() => setResetUser(u)}>
                                                Reset Password
                                            </Button>
                                            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDelUser(u)}>
                                                Delete User
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>

            </Container>

            <DeleteModal open={!!delUser}   onClose={() => setDelUser(null)}    user={delUser}   setUsers={setUsers} />
            <ResetModal  open={!!resetUser} onClose={() => setResetUser(null)}  user={resetUser} setUsers={setUsers} />
            <CreateModal open={createOpen}  onClose={() => setCreateOpen(false)}                 setUsers={setUsers} />
        </Box>
    );
}

function DeleteModal({ open, onClose, user, setUsers }) {
    const del = async () => {
        const res = await axios.delete(`/api/users?user=${user._id}`);
        if (res.data.error) alert(res.data.msg);
        else { setUsers(res.data.users); onClose(); }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Are you sure you want to delete <strong style={{ color: "#111827" }}>{user?.userName}</strong>? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="error" onClick={del}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
}

function ResetModal({ open, onClose, user, setUsers }) {
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);

    const reset = async () => {
        const res = await axios.post("/api/users", { user, password });
        if (res.data.error) alert(res.data.msg);
        else { setPassword(""); setShowPass(false); setUsers(res.data.users); onClose(); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Reset Password
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Setting a new password for <strong style={{ color: "#111827" }}>{user?.userName}</strong>.
                </Typography>
                <TextField
                    fullWidth size="small" label="New Password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") reset(); }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShowPass(s => !s)}>
                                    {showPass ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={reset} disabled={!password}>Reset Password</Button>
            </DialogActions>
        </Dialog>
    );
}

function CreateModal({ open, onClose, setUsers }) {
    const [data, setData]         = useState(BLANK_USER);
    const [showPass, setShowPass] = useState(false);

    const set    = (key) => (e) => setData(prev => ({ ...prev, [key]: e.target.value }));
    const toggle = (key, value) => setData(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }));

    const create = async () => {
        const res = await axios.post("/api/auth/register", { ...data });
        if (res.data.success) {
            setUsers(res.data.users);
            setData(BLANK_USER);
            setShowPass(false);
            onClose();
        } else {
            alert(`Something went wrong — the account for "${data.userName}" was not created.\n${res.data.error ?? ""}`);
        }
    };

    const canCreate = data.userName.trim() && data.email.trim() && data.password;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Create User
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ backgroundColor: "#fafbff" }}>
                <Stack spacing={3}>
                    <Grid2 container spacing={1.5}>
                        <Grid2 size={12}>
                            <TextField fullWidth size="small" label="Username" value={data.userName} onChange={set("userName")} />
                        </Grid2>
                        <Grid2 size={6}>
                            <TextField fullWidth size="small" label="First Name" value={data.firstName} onChange={set("firstName")} />
                        </Grid2>
                        <Grid2 size={6}>
                            <TextField fullWidth size="small" label="Last Name" value={data.lastName} onChange={set("lastName")} />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField fullWidth size="small" label="Email" type="email" value={data.email} onChange={set("email")} />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField
                                fullWidth size="small" label="Password"
                                type={showPass ? "text" : "password"}
                                value={data.password}
                                onChange={set("password")}
                                onKeyDown={(e) => { if (e.key === "Enter" && canCreate) create(); }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowPass(s => !s)}>
                                                {showPass ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid2>
                    </Grid2>

                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "text.disabled", display: "block", mb: 1.5 }}>
                            Access Permissions
                        </Typography>
                        <PermGrid permissions={data.permissions} onToggle={toggle} />
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={create} disabled={!canCreate}>Create User</Button>
            </DialogActions>
        </Dialog>
    );
}

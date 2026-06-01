"use client";
import {
    Box, Typography, Container, Stack, Card, Avatar,
    Chip, IconButton, Collapse, Divider, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Grid2, Tooltip, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import PeopleIcon           from "@mui/icons-material/People";
import PersonAddIcon        from "@mui/icons-material/PersonAdd";
import KeyIcon              from "@mui/icons-material/Key";
import PersonOffIcon        from "@mui/icons-material/PersonOff";
import ExpandMoreIcon       from "@mui/icons-material/ExpandMore";
import ExpandLessIcon       from "@mui/icons-material/ExpandLess";
import CloseIcon            from "@mui/icons-material/Close";
import Visibility           from "@mui/icons-material/Visibility";
import VisibilityOff        from "@mui/icons-material/VisibilityOff";
import ShoppingCartIcon     from "@mui/icons-material/ShoppingCart";
import PrintIcon            from "@mui/icons-material/Print";
import StorefrontIcon       from "@mui/icons-material/Storefront";
import BrushIcon            from "@mui/icons-material/Brush";
import CheckroomIcon        from "@mui/icons-material/Checkroom";
import SyncAltIcon          from "@mui/icons-material/SyncAlt";
import ManageAccountsIcon   from "@mui/icons-material/ManageAccounts";
import BarChartIcon         from "@mui/icons-material/BarChart";
import InventoryIcon        from "@mui/icons-material/Inventory";
import { useState } from "react";

const PERMISSIONS = [
    { key: "orders",       label: "Orders",       icon: <ShoppingCartIcon sx={{ fontSize: 14 }} /> },
    { key: "production",   label: "Production",   icon: <PrintIcon sx={{ fontSize: 14 }} /> },
    { key: "products",     label: "Products",     icon: <StorefrontIcon sx={{ fontSize: 14 }} /> },
    { key: "designs",      label: "Designs",      icon: <BrushIcon sx={{ fontSize: 14 }} /> },
    { key: "blanks",       label: "Blanks",       icon: <CheckroomIcon sx={{ fontSize: 14 }} /> },
    { key: "integrations", label: "Integrations", icon: <SyncAltIcon sx={{ fontSize: 14 }} /> },
    { key: "users",        label: "Users",        icon: <PeopleIcon sx={{ fontSize: 14 }} /> },
    { key: "reports",      label: "Reports",      icon: <BarChartIcon sx={{ fontSize: 14 }} /> },
];

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

function initials(u) {
    if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    return (u.userName?.[0] ?? u.email?.[0] ?? "?").toUpperCase();
}

function displayName(u) {
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return u.userName || u.email;
}

function permCount(u) {
    return Object.values(u.permissions ?? {}).filter(Boolean).length;
}

function UserAvatar({ u, size = 44 }) {
    const color = avatarColor(u.email || u.userName || "");
    const online = isOnline(u.lastSeen);
    return (
        <Box sx={{ position: "relative", flexShrink: 0, width: size, height: size }}>
            <Avatar sx={{ bgcolor: color, width: size, height: size, fontSize: size > 36 ? "1rem" : "0.75rem", fontWeight: 800, boxShadow: `0 0 0 3px ${color}22` }}>
                {initials(u)}
            </Avatar>
            <Box sx={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", bgcolor: online ? "#22c55e" : "#9ca3af", border: "2px solid #fff" }} />
        </Box>
    );
}

function PermGrid({ permissions, onToggle, disabled }) {
    return (
        <Grid2 container spacing={1}>
            {PERMISSIONS.map(p => {
                const active = !!permissions?.[p.key];
                return (
                    <Grid2 key={p.key} size={{ xs: 6, sm: 4, md: 3 }}>
                        <Box
                            onClick={() => !disabled && onToggle(p.key, !active)}
                            sx={{
                                display: "flex", alignItems: "center", gap: 1,
                                px: 1.25, py: 0.9, borderRadius: 1.5, border: "1px solid",
                                borderColor: active ? "primary.main" : "divider",
                                backgroundColor: active ? "primary.main" : "#fff",
                                color: active ? "#fff" : "text.secondary",
                                cursor: disabled ? "default" : "pointer",
                                userSelect: "none",
                                transition: "all 140ms",
                                ...(!disabled && {
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        backgroundColor: active ? "primary.dark" : "rgba(99,102,241,0.06)",
                                        color: active ? "#fff" : "primary.main",
                                    },
                                }),
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

export function PlatformUsersPage({ users: initialUsers }) {
    const [users, setUsers]           = useState(initialUsers);
    const [opened, setOpened]         = useState("");
    const [deactivateUser, setDeactivateUser] = useState(null);
    const [resetUser, setResetUser]   = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [saving, setSaving]         = useState(false);

    const totalPerms = users.reduce((acc, u) => acc + permCount(u), 0);

    const updatePermissions = async (u, key, value) => {
        const updated = { ...u, permissions: { ...(u.permissions ?? {}), [key]: value } };
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: u._id, permissions: updated.permissions }),
        });
        const d = await res.json();
        if (d.error) alert(d.error);
        else setUsers(prev => prev.map(x => x._id === d.user._id ? d.user : x));
    };

    return (
        <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>

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

                <Stack spacing={1.5}>
                    {users.length === 0 && (
                        <Card variant="outlined" sx={{ borderRadius: 3 }}>
                            <Box sx={{ py: 10, textAlign: "center" }}>
                                <ManageAccountsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                <Typography variant="body1" fontWeight={600} color="text.secondary">No users yet</Typography>
                                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Add a user to get started</Typography>
                                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}>Add User</Button>
                            </Box>
                        </Card>
                    )}

                    {users.map(u => {
                        const isOpen = opened === u._id;
                        const count  = permCount(u);
                        const color  = avatarColor(u.email || u.userName || "");
                        const name   = displayName(u);
                        const activePerms = PERMISSIONS.filter(p => u.permissions?.[p.key]);
                        const isOwner = u.role === "owner";
                        const inactive = u.isActive === false;

                        return (
                            <Card key={u._id} variant="outlined" sx={{
                                borderRadius: 2.5,
                                opacity: inactive ? 0.6 : 1,
                                transition: "box-shadow 150ms, border-color 150ms",
                                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderColor: "rgba(99,102,241,0.3)" },
                                ...(isOpen && { borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }),
                            }}>
                                <Box
                                    sx={{ display: "flex", alignItems: "center", px: 2.5, py: 2, gap: 2, cursor: "pointer" }}
                                    onClick={() => setOpened(isOpen ? "" : u._id)}
                                >
                                    <UserAvatar u={u} size={44} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
                                            <Chip label={u.role} size="small" variant="outlined"
                                                color={u.role === "owner" ? "primary" : u.role === "admin" ? "secondary" : "default"}
                                                sx={{ fontSize: "0.65rem", height: 18 }}
                                            />
                                            {inactive && <Chip label="Inactive" size="small" color="default" sx={{ fontSize: "0.65rem", height: 18 }} />}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {u.email}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}>
                                        {activePerms.slice(0, 3).map(p => (
                                            <Tooltip key={p.key} title={p.label} arrow>
                                                <Box sx={{ width: 26, height: 26, borderRadius: 1.5, backgroundColor: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {p.icon}
                                                </Box>
                                            </Tooltip>
                                        ))}
                                        {activePerms.length > 3 && (
                                            <Box sx={{ width: 26, height: 26, borderRadius: 1.5, backgroundColor: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                                        sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0, fontSize: "0.7rem", fontWeight: 600, backgroundColor: count > 0 ? `${color}18` : undefined, color: count > 0 ? color : "text.disabled", borderColor: count > 0 ? `${color}40` : undefined }}
                                    />

                                    <IconButton size="small" sx={{ flexShrink: 0, color: "text.secondary" }} onClick={(e) => { e.stopPropagation(); setOpened(isOpen ? "" : u._id); }}>
                                        {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                    </IconButton>
                                </Box>

                                <Collapse in={isOpen} unmountOnExit>
                                    <Divider />
                                    <Box sx={{ px: 2.5, pt: 2.5, pb: 2, backgroundColor: "#fafbff" }}>
                                        {!isOwner && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "text.disabled", display: "block", mb: 1 }}>
                                                    Role
                                                </Typography>
                                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                                    <Select
                                                        value={u.role}
                                                        onChange={async (e) => {
                                                            const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u._id, role: e.target.value }) });
                                                            const d = await res.json();
                                                            if (d.error) alert(d.error);
                                                            else setUsers(prev => prev.map(x => x._id === d.user._id ? d.user : x));
                                                        }}
                                                    >
                                                        <MenuItem value="admin">Admin</MenuItem>
                                                        <MenuItem value="operator">Operator</MenuItem>
                                                        <MenuItem value="viewer">Viewer</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        )}

                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "text.disabled", display: "block", mb: 1.5 }}>
                                            Access Permissions
                                        </Typography>
                                        <PermGrid
                                            permissions={u.permissions}
                                            onToggle={(key, value) => updatePermissions(u, key, value)}
                                            disabled={isOwner}
                                        />
                                        {!isOwner && (
                                            <>
                                                <Divider sx={{ my: 2 }} />
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="outlined" startIcon={<KeyIcon />} onClick={() => setResetUser(u)}>
                                                        Reset Password
                                                    </Button>
                                                    {u.isActive !== false && (
                                                        <Button size="small" variant="outlined" color="error" startIcon={<PersonOffIcon />} onClick={() => setDeactivateUser(u)}>
                                                            Deactivate
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </>
                                        )}
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>

            </Container>

            <DeactivateModal open={!!deactivateUser} onClose={() => setDeactivateUser(null)} user={deactivateUser} setUsers={setUsers} />
            <ResetModal      open={!!resetUser}      onClose={() => setResetUser(null)}       user={resetUser}      setUsers={setUsers} />
            <CreateModal     open={createOpen}       onClose={() => setCreateOpen(false)}                           setUsers={setUsers} />
        </Box>
    );
}

function DeactivateModal({ open, onClose, user, setUsers }) {
    const deactivate = async () => {
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, isActive: false }),
        });
        const d = await res.json();
        if (d.error) alert(d.error);
        else { setUsers(prev => prev.map(x => x._id === d.user._id ? d.user : x)); onClose(); }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Deactivate User</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Deactivate <strong style={{ color: "#111827" }}>{user?.firstName} {user?.lastName}</strong>? They will no longer be able to sign in.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="error" onClick={deactivate}>Deactivate</Button>
            </DialogActions>
        </Dialog>
    );
}

function ResetModal({ open, onClose, user, setUsers }) {
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [saving, setSaving] = useState(false);

    const reset = async () => {
        setSaving(true);
        const res = await fetch("/api/users/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, password }),
        });
        const d = await res.json();
        setSaving(false);
        if (d.error) alert(d.error);
        else { setPassword(""); setShowPass(false); onClose(); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Reset Password
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Setting a new password for <strong style={{ color: "#111827" }}>{user?.firstName} {user?.lastName}</strong>.
                </Typography>
                <TextField
                    fullWidth size="small" label="New Password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && password) reset(); }}
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
                <Button variant="contained" onClick={reset} disabled={!password || saving}>
                    {saving ? "Saving…" : "Reset Password"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function CreateModal({ open, onClose, setUsers }) {
    const [email, setEmail]         = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]   = useState("");
    const [password, setPassword]   = useState("");
    const [role, setRole]           = useState("operator");
    const [showPass, setShowPass]   = useState(false);
    const [saving, setSaving]       = useState(false);

    const create = async () => {
        setSaving(true);
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, firstName, lastName, password, role }),
        });
        const d = await res.json();
        setSaving(false);
        if (d.error) alert(d.error);
        else {
            setUsers(prev => [...prev, d.user]);
            setEmail(""); setFirstName(""); setLastName(""); setPassword(""); setRole("operator");
            setShowPass(false); onClose();
        }
    };

    const canCreate = email.trim() && password;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Add User
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ backgroundColor: "#fafbff" }}>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                        <TextField fullWidth size="small" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        <TextField fullWidth size="small" label="Last Name"  value={lastName}  onChange={(e) => setLastName(e.target.value)} />
                    </Stack>
                    <TextField fullWidth size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <TextField
                        fullWidth size="small" label="Temporary Password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                    <FormControl size="small" fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="operator">Operator</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={create} disabled={!canCreate || saving}>
                    {saving ? "Creating…" : "Add User"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

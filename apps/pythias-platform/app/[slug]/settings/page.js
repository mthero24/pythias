"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Box, Container, Typography, Card, CardContent, Stack, TextField, Button, Alert,
    Table, TableBody, TableCell, TableHead, TableRow, Chip, MenuItem, Select,
    InputLabel, FormControl, Switch, FormControlLabel, Tooltip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const PERMISSIONS = [
    { key: "orders",       label: "Orders" },
    { key: "production",   label: "Production" },
    { key: "products",     label: "Products" },
    { key: "designs",      label: "Designs" },
    { key: "blanks",       label: "Blanks" },
    { key: "integrations", label: "Integrations" },
    { key: "users",        label: "Users" },
    { key: "reports",      label: "Reports / Analytics" },
];

const ROLE_DEFAULTS = {
    owner:    Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
    admin:    Object.fromEntries(PERMISSIONS.map(p => [p.key, true])),
    operator: { orders: true, production: true, products: false, designs: false, blanks: false, integrations: false, users: false, reports: false },
    viewer:   { orders: true, production: false, products: false, designs: false, blanks: false, integrations: false, users: false, reports: false },
};

export default function SettingsPage() {
    const { data: session } = useSession();
    const [org, setOrg]         = useState(null);
    const [users, setUsers]     = useState([]);
    const [tab, setTab]         = useState("org");
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState(null);

    const [skuParts, setSkuParts]     = useState(["blank.code", "color.sku", "size.sku", "design.sku"]);
    const [skuSeparator, setSkuSeparator] = useState("_");
    const [gs1ApiKey, setGs1ApiKey]             = useState("");
    const [gs1AccountNumber, setGs1AccountNumber] = useState("");

    // Add user form
    const [inviteEmail, setInviteEmail]       = useState("");
    const [inviteRole, setInviteRole]         = useState("operator");
    const [inviteFirst, setInviteFirst]       = useState("");
    const [inviteLast, setInviteLast]         = useState("");
    const [invitePassword, setInvitePassword] = useState("");

    // Edit user permissions dialog
    const [editUser, setEditUser]   = useState(null);
    const [editPerms, setEditPerms] = useState({});
    const [editRole, setEditRole]   = useState("");

    useEffect(() => {
        fetch("/api/settings").then(r => r.json()).then(d => {
            if (d.org) setOrg(d.org);
        });
        fetch("/api/users").then(r => r.json()).then(d => {
            if (d.users) setUsers(d.users);
        });
        fetch("/api/admin/settings/sku").then(r => r.json()).then(d => {
            if (!d.error && d.format) {
                setSkuParts(d.format.parts ?? ["blank.code", "color.sku", "size.sku", "design.sku"]);
                setSkuSeparator(d.format.separator ?? "_");
            }
        });
        fetch("/api/admin/settings/gs1").then(r => r.json()).then(d => {
            if (!d.error && d.gs1) {
                setGs1ApiKey(d.gs1.apiKey ?? "");
                setGs1AccountNumber(d.gs1.accountNumber ?? "");
            }
        });
    }, []);

    async function saveOrg(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgName: org.name, timezone: org.settings?.timezone, bulkThreshold: org.settings?.bulkThreshold }),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Saved" });
        setSaving(false);
    }

    async function addUser(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inviteEmail, firstName: inviteFirst, lastName: inviteLast, password: invitePassword, role: inviteRole }),
        });
        const d = await res.json();
        if (d.error) {
            setMsg({ type: "error", text: d.error });
        } else {
            setUsers(u => [...u, d.user]);
            setInviteEmail(""); setInviteFirst(""); setInviteLast(""); setInvitePassword("");
            setMsg({ type: "success", text: "User added" });
        }
        setSaving(false);
    }

    function openEditUser(u) {
        setEditUser(u);
        setEditRole(u.role);
        const perms = { ...ROLE_DEFAULTS[u.role], ...u.permissions };
        setEditPerms(perms);
    }

    function handleRoleChange(role) {
        setEditRole(role);
        setEditPerms({ ...ROLE_DEFAULTS[role], ...editUser.permissions });
    }

    async function saveUserPermissions() {
        setSaving(true);
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: editUser._id, role: editRole, permissions: editPerms }),
        });
        const d = await res.json();
        if (d.error) {
            setMsg({ type: "error", text: d.error });
        } else {
            setUsers(us => us.map(u => u._id === d.user._id ? d.user : u));
            setEditUser(null);
            setMsg({ type: "success", text: "User updated" });
        }
        setSaving(false);
    }

    async function deactivateUser(userId) {
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, isActive: false }),
        });
        const d = await res.json();
        if (!d.error) setUsers(us => us.map(u => u._id === userId ? { ...u, isActive: false } : u));
    }

    if (!org) return null;

    const isOwnerOrAdmin = session?.user?.role === "owner" || session?.user?.role === "admin";

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                    {["org", "production", "sku", "gs1", "users"].map(t => (
                        <Button key={t} variant={tab === t ? "contained" : "outlined"} size="small" onClick={() => setTab(t)}>
                            {t === "org" ? "Organization" : t === "production" ? "Production" : t === "sku" ? "SKU Format" : t === "gs1" ? "GS1 / UPC" : "Users & Permissions"}
                        </Button>
                    ))}
                    <Button variant="outlined" size="small" href="settings/shipping">
                        Shipping &amp; Hardware
                    </Button>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                {tab === "org" && (
                    <Card variant="outlined">
                        <CardContent>
                            <form onSubmit={saveOrg}>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Company name"
                                        value={org.name || ""}
                                        onChange={e => setOrg(o => ({ ...o, name: e.target.value }))}
                                        fullWidth size="small"
                                        disabled={!isOwnerOrAdmin}
                                    />
                                    <TextField
                                        label="Timezone"
                                        value={org.settings?.timezone || "America/New_York"}
                                        onChange={e => setOrg(o => ({ ...o, settings: { ...o.settings, timezone: e.target.value } }))}
                                        fullWidth size="small"
                                        disabled={!isOwnerOrAdmin}
                                    />
                                    {isOwnerOrAdmin && (
                                        <Button type="submit" variant="contained" size="small" disabled={saving}>
                                            {saving ? "Saving..." : "Save changes"}
                                        </Button>
                                    )}
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {tab === "production" && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Bulk order threshold</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Orders with this many items or more are automatically flagged as bulk orders and appear in the Bulk Orders production queue.
                            </Typography>
                            <form onSubmit={saveOrg}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <TextField
                                        label="Items per order"
                                        type="number"
                                        inputProps={{ min: 1, max: 999 }}
                                        value={org.settings?.bulkThreshold ?? 5}
                                        onChange={e => setOrg(o => ({ ...o, settings: { ...o.settings, bulkThreshold: Number(e.target.value) } }))}
                                        size="small"
                                        sx={{ width: 160 }}
                                        disabled={!isOwnerOrAdmin}
                                    />
                                    {isOwnerOrAdmin && (
                                        <Button type="submit" variant="contained" size="small" disabled={saving}>
                                            {saving ? "Saving..." : "Save"}
                                        </Button>
                                    )}
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {tab === "sku" && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>SKU Format</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Set the order and separator used when generating product variant SKUs. Use the arrows to reorder parts.
                            </Typography>

                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {skuParts.map((part, i) => {
                                    const labels = {
                                        "blank.code": "Blank Style Code",
                                        "color.sku":  "Color Code",
                                        "size.sku":   "Size Code",
                                        "design.sku": "Design SKU",
                                    };
                                    return (
                                        <Stack key={part} direction="row" alignItems="center" spacing={1}
                                            sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper" }}>
                                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                                <Chip label={i + 1} size="small" sx={{ mr: 1, fontSize: "0.7rem" }} />
                                                {labels[part] ?? part}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>{part}</Typography>
                                            <IconButton size="small" disabled={i === 0} onClick={() => {
                                                const p = [...skuParts];
                                                [p[i - 1], p[i]] = [p[i], p[i - 1]];
                                                setSkuParts(p);
                                            }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" disabled={i === skuParts.length - 1} onClick={() => {
                                                const p = [...skuParts];
                                                [p[i + 1], p[i]] = [p[i], p[i + 1]];
                                                setSkuParts(p);
                                            }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    );
                                })}
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <TextField
                                    label="Separator"
                                    value={skuSeparator}
                                    onChange={e => setSkuSeparator(e.target.value)}
                                    size="small"
                                    sx={{ width: 100 }}
                                    inputProps={{ maxLength: 3 }}
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Preview:</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, mt: 0.25 }}>
                                        {skuParts.map(p => ({
                                            "blank.code": "PC54",
                                            "color.sku":  "blk",
                                            "size.sku":   "L",
                                            "design.sku": "ABCD1234",
                                        }[p] ?? p)).join(skuSeparator || "_")}
                                    </Typography>
                                </Box>
                            </Stack>

                            {isOwnerOrAdmin && (
                                <Button variant="contained" size="small" disabled={saving} onClick={async () => {
                                    setSaving(true); setMsg(null);
                                    const res = await fetch("/api/admin/settings/sku", {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ parts: skuParts, separator: skuSeparator }),
                                    });
                                    const d = await res.json();
                                    setMsg(d.error ? { type: "error", text: d.msg } : { type: "success", text: "SKU format saved" });
                                    setSaving(false);
                                }}>
                                    {saving ? "Saving..." : "Save SKU Format"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tab === "gs1" && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>GS1 / UPC Settings</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter your GS1 credentials to enable UPC/GTIN generation on products. If not configured, UPCs will not be assigned when creating products.
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="GS1 API Key"
                                    type="password"
                                    value={gs1ApiKey}
                                    onChange={e => setGs1ApiKey(e.target.value)}
                                    fullWidth size="small"
                                    disabled={!isOwnerOrAdmin}
                                    autoComplete="off"
                                />
                                <TextField
                                    label="GS1 Account Number"
                                    value={gs1AccountNumber}
                                    onChange={e => setGs1AccountNumber(e.target.value)}
                                    fullWidth size="small"
                                    disabled={!isOwnerOrAdmin}
                                    helperText="X-Product-Owner-Account-Id used in GS1 US API requests"
                                />
                                {gs1ApiKey && (
                                    <Alert severity="success" sx={{ py: 0.5 }}>GS1 is configured — UPCs will be assigned to new products.</Alert>
                                )}
                                {!gs1ApiKey && (
                                    <Alert severity="warning" sx={{ py: 0.5 }}>GS1 is not configured — products will be created without UPCs.</Alert>
                                )}
                                {isOwnerOrAdmin && (
                                    <Button variant="contained" size="small" disabled={saving} onClick={async () => {
                                        setSaving(true); setMsg(null);
                                        const res = await fetch("/api/admin/settings/gs1", {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ apiKey: gs1ApiKey, accountNumber: gs1AccountNumber }),
                                        });
                                        const d = await res.json();
                                        setMsg(d.error ? { type: "error", text: d.msg } : { type: "success", text: "GS1 settings saved" });
                                        setSaving(false);
                                    }}>
                                        {saving ? "Saving..." : "Save GS1 Settings"}
                                    </Button>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {tab === "users" && (
                    <Stack spacing={3}>
                        <Card variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Role</TableCell>
                                        <TableCell>Last seen</TableCell>
                                        <TableCell>Status</TableCell>
                                        {isOwnerOrAdmin && <TableCell />}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map(u => (
                                        <TableRow key={u._id} sx={{ opacity: u.isActive === false ? 0.5 : 1 }}>
                                            <TableCell>{u.firstName} {u.lastName}</TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>{u.email}</TableCell>
                                            <TableCell>
                                                <Chip label={u.role} size="small" variant="outlined"
                                                    color={u.role === "owner" ? "primary" : u.role === "admin" ? "secondary" : "default"}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>
                                                {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString() : "Never"}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={u.isActive !== false ? "Active" : "Inactive"}
                                                    size="small"
                                                    color={u.isActive !== false ? "success" : "default"}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            {isOwnerOrAdmin && (
                                                <TableCell align="right">
                                                    {u.role !== "owner" && (
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <Tooltip title="Edit permissions">
                                                                <IconButton size="small" onClick={() => openEditUser(u)}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {u.isActive !== false && (
                                                                <Tooltip title="Deactivate">
                                                                    <IconButton size="small" color="error" onClick={() => deactivateUser(u._id)}>
                                                                        <PersonOffIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>

                        {isOwnerOrAdmin && (
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Add user</Typography>
                                    <form onSubmit={addUser}>
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={1}>
                                                <TextField label="First name" value={inviteFirst} onChange={e => setInviteFirst(e.target.value)} required size="small" fullWidth />
                                                <TextField label="Last name"  value={inviteLast}  onChange={e => setInviteLast(e.target.value)}  required size="small" fullWidth />
                                            </Stack>
                                            <TextField label="Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required size="small" fullWidth />
                                            <TextField label="Temporary password" type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} required size="small" fullWidth />
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Role</InputLabel>
                                                <Select value={inviteRole} label="Role" onChange={e => setInviteRole(e.target.value)}>
                                                    <MenuItem value="admin">Admin</MenuItem>
                                                    <MenuItem value="operator">Operator</MenuItem>
                                                    <MenuItem value="viewer">Viewer</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <Button type="submit" variant="contained" size="small" disabled={saving}>
                                                Add user
                                            </Button>
                                        </Stack>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                )}
            </Container>

            {/* Edit permissions dialog */}
            <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Edit — {editUser?.firstName} {editUser?.lastName}
                </DialogTitle>
                <DialogContent>
                    <FormControl size="small" fullWidth sx={{ mb: 2, mt: 0.5 }}>
                        <InputLabel>Role</InputLabel>
                        <Select value={editRole} label="Role" onChange={e => handleRoleChange(e.target.value)}>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="operator">Operator</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                        </Select>
                    </FormControl>

                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
                        Feature access
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Stack spacing={0.5}>
                        {PERMISSIONS.map(p => (
                            <FormControlLabel
                                key={p.key}
                                control={
                                    <Switch
                                        size="small"
                                        checked={!!editPerms[p.key]}
                                        onChange={e => setEditPerms(prev => ({ ...prev, [p.key]: e.target.checked }))}
                                    />
                                }
                                label={<Typography variant="body2">{p.label}</Typography>}
                                sx={{ ml: 0 }}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEditUser(null)} size="small">Cancel</Button>
                    <Button onClick={saveUserPermissions} variant="contained" size="small" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

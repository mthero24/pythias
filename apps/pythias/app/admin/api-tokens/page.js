"use client";
import { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Paper, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function ApiTokensPage() {
    const [tokens, setTokens]           = useState([]);
    const [open, setOpen]               = useState(false);
    const [name, setName]               = useState("");
    const [type, setType]               = useState("articles");
    const [newToken, setNewToken]       = useState(null);
    const [copied, setCopied]           = useState(false);
    const [loading, setLoading]         = useState(false);

    async function load() {
        const res = await fetch("/api/admin/webhook-tokens");
        const data = await res.json();
        setTokens(data.tokens || []);
    }

    useEffect(() => { load(); }, []);

    async function generate() {
        if (!name.trim()) return;
        setLoading(true);
        const res = await fetch("/api/admin/webhook-tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type }),
        });
        const data = await res.json();
        setNewToken(data.token);
        setName("");
        setLoading(false);
        load();
    }

    async function revoke(id) {
        if (!confirm("Revoke this token? Any service using it will lose access.")) return;
        await fetch(`/api/admin/webhook-tokens?id=${id}`, { method: "DELETE" });
        load();
    }

    function copy(text) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900 }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>API Tokens</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Generate bearer tokens for webhook integrations (e.g. blog CMS).
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                    New Token
                </Button>
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8faff" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Token</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Last Used</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tokens.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>
                                    No tokens yet. Generate one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {tokens.map((t) => (
                            <TableRow key={t._id} sx={{ opacity: t.active ? 1 : 0.45 }}>
                                <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                                <TableCell><Chip label={t.type} size="small" /></TableCell>
                                <TableCell sx={{ fontFamily: "monospace", fontSize: 13, color: "text.secondary" }}>{t.token}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={t.active ? "Active" : "Revoked"}
                                        size="small"
                                        color={t.active ? "success" : "default"}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>
                                    {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "Never"}
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {t.active && (
                                        <Tooltip title="Revoke token">
                                            <IconButton size="small" color="error" onClick={() => revoke(t._id)}>
                                                <BlockIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Generate dialog */}
            <Dialog open={open} onClose={() => { setOpen(false); setNewToken(null); }} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Generate New Token</DialogTitle>
                <DialogContent>
                    {newToken ? (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Copy this token now — it will never be shown again.
                            </Alert>
                            <Box sx={{
                                display: "flex", alignItems: "center", gap: 1,
                                bgcolor: "#1e1e2e", borderRadius: 2, p: 2,
                            }}>
                                <Typography sx={{ flex: 1, fontFamily: "monospace", fontSize: 13, color: "#cdd6f4", wordBreak: "break-all" }}>
                                    {newToken}
                                </Typography>
                                <Tooltip title={copied ? "Copied!" : "Copy"}>
                                    <IconButton onClick={() => copy(newToken)} size="small" sx={{ color: "#cdd6f4" }}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                                Use as: <code>Authorization: Bearer {newToken.slice(0, 8)}…</code>
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                            <TextField
                                label="Token name"
                                placeholder="e.g. Blog CMS, Content Tool"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                autoFocus
                            />
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select value={type} label="Type" onChange={(e) => setType(e.target.value)}>
                                    <MenuItem value="articles">articles</MenuItem>
                                    <MenuItem value="general">general</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setOpen(false); setNewToken(null); }}>
                        {newToken ? "Done" : "Cancel"}
                    </Button>
                    {!newToken && (
                        <Button variant="contained" onClick={generate} disabled={!name.trim() || loading}
                            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                            Generate
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

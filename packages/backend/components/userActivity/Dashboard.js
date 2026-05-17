"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
    TableRow, Chip, ToggleButton, ToggleButtonGroup, CircularProgress,
    Select, MenuItem, FormControl, InputLabel, Divider, Tabs, Tab,
    Collapse, IconButton, Pagination,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "axios";

const ACTION_LABELS = {
    blank_create:   "Blank Created",
    blank_update:   "Blank Updated",
    blank_delete:   "Blank Deleted",
    design_create:  "Design Created",
    design_update:  "Design Updated",
    design_delete:  "Design Deleted",
    product_update: "Product Saved",
    product_delete: "Product Deleted",
    order_shipped:  "Shipped",
    order_binned:   "Binned",
    dtf_sent:       "DTF Sent",
    label_print:    "Labels Printed",
    item_folded:    "Folded",
    item_repull:    "Repulled",
};

const ACTION_COLOR = {
    blank_create:   "success",
    blank_update:   "primary",
    blank_delete:   "error",
    design_create:  "success",
    design_update:  "primary",
    design_delete:  "error",
    product_update: "primary",
    product_delete: "error",
    order_shipped:  "info",
    order_binned:   "warning",
    dtf_sent:       "secondary",
    label_print:    "success",
    item_folded:    "info",
    item_repull:    "warning",
};

const ENTITY_ACTION_COLOR = { create: "success", update: "primary", delete: "error" };

const FIELD_LABELS = {
    // Blank
    name: "Name", code: "Style Code", type: "Type", brand: "Brand",
    active: "Active", description: "Description", department: "Department",
    subcategory: "Subcategory", vendor: "Vendor", retailPrice: "Retail Price",
    category: "Category", suppliers: "Suppliers", tags: "Tags",
    searchTagKeywords: "Search Keywords", printTypes: "Print Types",
    printOnBack: "Print on Back", tearawayLabel: "Tearaway Label",
    isHeavyShipping: "Heavy Shipping", onlyAvailableForBulk: "Bulk Only",
    hasExtra: "Has Extra",
    colors: "Colors", sizes: "Sizes", bulletPoints: "Bullet Points",
    printLocations: "Print Locations", images: "Images",
    envelopes: "Envelopes (Print Settings)", fold: "Fold Settings",
    // Design
    sku: "SKU", sendToMarketplaces: "Send to Marketplaces",
    printType: "Print Type", gender: "Gender", season: "Season",
    published: "Published", blanks: "Blanks",
    // Product
    productDescription: "Product Description", price: "Price", title: "Title",
};

function ChangeRow({ entry }) {
    const [open, setOpen] = useState(false);
    const hasChanges = entry.changes?.length > 0;
    const ts = new Date(entry.timestamp);

    return (
        <>
            <TableRow
                hover
                sx={{ cursor: hasChanges ? "pointer" : "default", "& > *": { borderBottom: open ? "none" : undefined } }}
                onClick={() => hasChanges && setOpen(o => !o)}
            >
                <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                    <Typography variant="caption" display="block">{ts.toLocaleDateString()}</Typography>
                    <Typography variant="caption" color="text.secondary">{ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight={500}>{entry.userName}</Typography>
                    <Typography variant="caption" color="text.secondary">{entry.email}</Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>{entry.entityType}</Typography>
                    <Typography variant="body2" fontWeight={500}>{entry.entityName || "—"}</Typography>
                </TableCell>
                <TableCell>
                    <Chip
                        size="small"
                        label={entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                        color={ENTITY_ACTION_COLOR[entry.action] ?? "default"}
                        variant="outlined"
                    />
                </TableCell>
                <TableCell>
                    {hasChanges ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                {entry.changes.length} field{entry.changes.length !== 1 ? "s" : ""} changed
                            </Typography>
                            <IconButton size="small" sx={{ p: 0.25 }}>
                                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                        </Box>
                    ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                </TableCell>
            </TableRow>
            {hasChanges && (
                <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 1.5, px: 2, bgcolor: "action.hover", borderRadius: 1, mb: 0.5 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", py: 0.5 }}>Field</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", py: 0.5 }}>Before</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", py: 0.5 }}>After</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {entry.changes.map((c, i) => (
                                            <TableRow key={i}>
                                                <TableCell sx={{ py: 0.5, fontSize: "0.78rem", fontWeight: 500 }}>
                                                    {FIELD_LABELS[c.field] ?? c.field}
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, fontSize: "0.78rem", color: "error.main" }}>
                                                    {c.before || <em style={{ opacity: 0.4 }}>empty</em>}
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5, fontSize: "0.78rem", color: "success.main" }}>
                                                    {c.after || <em style={{ opacity: 0.4 }}>empty</em>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export function ActivityDashboard({ provider = "premierPrinting", apiBase = "/api/admin/activity" }) {
    const changelogBase = apiBase.replace("/activity", "/changelog");

    const [tab, setTab] = useState(0);
    const [range, setRange] = useState("day");
    const [selectedUser, setSelectedUser] = useState("all");

    // Activity tab state
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState({});
    const [timeline, setTimeline] = useState([]);
    const [since, setSince] = useState(null);

    // Changes tab state
    const [changesLoading, setChangesLoading] = useState(false);
    const [changes, setChanges] = useState([]);
    const [changesTotal, setChangesTotal] = useState(0);
    const [changesPage, setChangesPage] = useState(1);
    const [changesPages, setChangesPages] = useState(1);
    const [entityTypeFilter, setEntityTypeFilter] = useState("all");

    const loadActivity = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ provider, range });
            if (selectedUser !== "all") params.set("user", selectedUser);
            const { data } = await axios.get(`${apiBase}?${params}`);
            if (!data.error) { setUsers(data.users); setTimeline(data.timeline); setSince(data.since); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [provider, range, selectedUser, apiBase]);

    const loadChanges = useCallback(async () => {
        setChangesLoading(true);
        try {
            const params = new URLSearchParams({ provider, range, page: changesPage });
            if (selectedUser !== "all") params.set("user", selectedUser);
            if (entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
            const { data } = await axios.get(`${changelogBase}?${params}`);
            if (!data.error) { setChanges(data.entries); setChangesTotal(data.total); setChangesPages(data.pages); }
        } catch (e) { console.error(e); }
        finally { setChangesLoading(false); }
    }, [provider, range, selectedUser, entityTypeFilter, changesPage, changelogBase]);

    useEffect(() => { if (tab === 0) loadActivity(); }, [loadActivity, tab]);
    useEffect(() => { if (tab === 1) loadChanges(); }, [loadChanges, tab]);

    // Reset to page 1 when filters change
    useEffect(() => { setChangesPage(1); }, [range, selectedUser, entityTypeFilter]);

    const userNames = Object.keys(users).sort();
    const actionsPresent = [...new Set(Object.values(users).flatMap(u => Object.keys(u.actions)))].sort();
    const timelineByUser = {};
    for (const row of timeline) {
        const { userName, bucket } = row._id;
        if (!timelineByUser[userName]) timelineByUser[userName] = [];
        timelineByUser[userName].push({ bucket: new Date(bucket), count: row.count });
    }
    const rangeLabel = { hour: "Last Hour", day: "Last 24 Hours", week: "Last 7 Days", month: "Last 30 Days" }[range];

    const controls = (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>User</InputLabel>
                <Select value={selectedUser} label="User" onChange={e => setSelectedUser(e.target.value)}>
                    <MenuItem value="all">All Users</MenuItem>
                    {userNames.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
            </FormControl>
            {tab === 1 && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Entity</InputLabel>
                    <Select value={entityTypeFilter} label="Entity" onChange={e => setEntityTypeFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="blank">Blanks</MenuItem>
                        <MenuItem value="design">Designs</MenuItem>
                        <MenuItem value="product">Products</MenuItem>
                    </Select>
                </FormControl>
            )}
            <ToggleButtonGroup
                size="small" value={range} exclusive
                onChange={(_, v) => { if (v) setRange(v); }}
            >
                <ToggleButton value="hour">Hour</ToggleButton>
                <ToggleButton value="day">Day</ToggleButton>
                <ToggleButton value="week">Week</ToggleButton>
                <ToggleButton value="month">Month</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h5" fontWeight={700}>Activity Dashboard</Typography>
                {since && tab === 0 && (
                    <Typography variant="caption" color="text.secondary">
                        Since {new Date(since).toLocaleString()}
                    </Typography>
                )}
                <Box sx={{ ml: "auto" }}>{controls}</Box>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Activity" />
                <Tab label="Change History" />
            </Tabs>

            {/* ── Activity Tab ── */}
            {tab === 0 && (
                loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
                ) : (
                    <>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
                            {userNames.map(u => (
                                <Chip key={u} label={`${u}: ${users[u].total}`} variant="outlined"
                                    color={selectedUser === u ? "primary" : "default"}
                                    onClick={() => setSelectedUser(selectedUser === u ? "all" : u)}
                                />
                            ))}
                        </Box>

                        <Paper variant="outlined" sx={{ mb: 4, overflow: "auto" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>User</strong></TableCell>
                                        {actionsPresent.map(a => (
                                            <TableCell key={a} align="center">
                                                <Typography variant="caption" fontWeight={600}>{ACTION_LABELS[a] ?? a}</Typography>
                                            </TableCell>
                                        ))}
                                        <TableCell align="center"><strong>Total</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {userNames.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={actionsPresent.length + 2} align="center">
                                                <Typography color="text.secondary" py={2}>No activity in {rangeLabel.toLowerCase()}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : userNames.map(u => (
                                        <TableRow key={u} hover>
                                            <TableCell>
                                                <Typography fontWeight={500}>{u}</Typography>
                                                <Typography variant="caption" color="text.secondary">{users[u].email}</Typography>
                                            </TableCell>
                                            {actionsPresent.map(a => (
                                                <TableCell key={a} align="center">
                                                    {users[u].actions[a] ? (
                                                        <Chip size="small" label={users[u].actions[a]} color={ACTION_COLOR[a] ?? "default"} variant="outlined" />
                                                    ) : (
                                                        <Typography color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell align="center"><Typography fontWeight={700}>{users[u].total}</Typography></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>

                        {Object.keys(timelineByUser).length > 0 && (
                            <>
                                <Divider sx={{ mb: 3 }} />
                                <Typography variant="h6" fontWeight={600} mb={2}>Timeline — {rangeLabel}</Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {Object.entries(timelineByUser).map(([u, rows]) => (
                                        <Paper key={u} variant="outlined" sx={{ p: 2 }}>
                                            <Typography fontWeight={600} mb={1}>{u}</Typography>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                {rows.map((r, i) => (
                                                    <Chip key={i} size="small"
                                                        label={`${r.bucket.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${r.count}`}
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            </>
                        )}
                    </>
                )
            )}

            {/* ── Changes Tab ── */}
            {tab === 1 && (
                changesLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            {changesTotal} change{changesTotal !== 1 ? "s" : ""} in {rangeLabel.toLowerCase()} — click a row to see field details
                        </Typography>
                        <Paper variant="outlined" sx={{ overflow: "auto", mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Time</strong></TableCell>
                                        <TableCell><strong>User</strong></TableCell>
                                        <TableCell><strong>Entity</strong></TableCell>
                                        <TableCell><strong>Action</strong></TableCell>
                                        <TableCell><strong>Changes</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {changes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">
                                                <Typography color="text.secondary" py={2}>No changes in {rangeLabel.toLowerCase()}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : changes.map(entry => (
                                        <ChangeRow key={entry._id} entry={entry} />
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        {changesPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Pagination count={changesPages} page={changesPage} onChange={(_, p) => setChangesPage(p)} color="primary" />
                            </Box>
                        )}
                    </>
                )
            )}
        </Box>
    );
}

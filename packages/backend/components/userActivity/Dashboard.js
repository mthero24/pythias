"use client";
import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
    TableRow, Chip, ToggleButton, ToggleButtonGroup, CircularProgress,
    Select, MenuItem, FormControl, InputLabel, Divider, Tabs, Tab,
    Collapse, IconButton, Pagination, TextField, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "axios";
import { LiveUsers } from "./LiveUsers";

const ACTION_LABELS = {
    blank_create:              "Blank Created",
    blank_update:              "Blank Updated",
    blank_delete:              "Blank Deleted",
    design_create:             "Design Created",
    design_update:             "Design Updated",
    design_delete:             "Design Deleted",
    product_update:            "Product Saved",
    product_delete:            "Product Deleted",
    order_shipped:             "Shipped",
    order_binned:              "Binned",
    order_received:            "Order Received",
    dtf_sent:                  "DTF Sent",
    label_print:               "Labels Printed",
    item_folded:               "Folded",
    item_repull:               "Repulled",
    inventory_update:          "Inventory Updated",
    inventory_order_create:    "Inventory Order Created",
    inventory_order_receive:   "Inventory Order Received",
    out_of_stock:              "Out of Stock",
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
    order_shipped:             "info",
    order_binned:              "warning",
    order_received:            "success",
    dtf_sent:                  "secondary",
    label_print:               "success",
    item_folded:               "info",
    item_repull:               "warning",
    inventory_update:          "primary",
    inventory_order_create:    "warning",
    inventory_order_receive:   "success",
    out_of_stock:              "error",
};

const ENTITY_ACTION_COLOR = { create: "success", update: "primary", delete: "error", repull: "warning" };

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

function ErrorRow({ entry }) {
    const [open, setOpen] = useState(false);
    const ts = new Date(entry.timestamp);
    const hasContext = entry.context && Object.keys(entry.context).length > 0;
    const hasStack = !!entry.stack;
    const expandable = hasContext || hasStack;
    return (
        <>
            <TableRow hover sx={{ cursor: expandable ? "pointer" : "default", "& > *": { borderBottom: open ? "none" : undefined } }} onClick={() => expandable && setOpen(o => !o)}>
                <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                    <Typography variant="caption" display="block">{ts.toLocaleDateString()}</Typography>
                    <Typography variant="caption" color="text.secondary">{ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Typography>
                </TableCell>
                <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{entry.source || "—"}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="error.main" sx={{ wordBreak: "break-word" }}>{entry.message}</Typography></TableCell>
                <TableCell>
                    {expandable ? (
                        <IconButton size="small" sx={{ p: 0.25 }}>{open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
                    ) : "—"}
                </TableCell>
            </TableRow>
            {expandable && (
                <TableRow>
                    <TableCell colSpan={4} sx={{ py: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 1.5, px: 2, bgcolor: "action.hover", borderRadius: 1, mb: 0.5 }}>
                                {hasContext && (
                                    <Box sx={{ mb: hasStack ? 1.5 : 0 }}>
                                        <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Context</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.73rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                            {JSON.stringify(entry.context, null, 2)}
                                        </Typography>
                                    </Box>
                                )}
                                {hasStack && (
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Stack Trace</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.7rem", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "error.main" }}>
                                            {entry.stack}
                                        </Typography>
                                    </Box>
                                )}
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
    const errorlogBase  = apiBase.replace("/activity", "/errorlog");
    const presenceBase  = apiBase.replace("/activity", "/users/presence");

    const [tab, setTab] = useState(0);
    const handleTabChange = (_, v) => {
        setTab(v);
        if (v !== 1) { setChangeUserSearch(""); setChangeEntitySearch(""); }
    };
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
    const [changeUserSearch, setChangeUserSearch] = useState("");
    const [changeEntitySearch, setChangeEntitySearch] = useState("");
    const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
    const [debouncedEntitySearch, setDebouncedEntitySearch] = useState("");

    // Errors tab state
    const [errorsLoading, setErrorsLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [errorsTotal, setErrorsTotal] = useState(0);
    const [errorsPage, setErrorsPage] = useState(1);
    const [errorsPages, setErrorsPages] = useState(1);

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
            if (debouncedUserSearch.trim()) params.set("userSearch", debouncedUserSearch.trim());
            if (debouncedEntitySearch.trim()) params.set("entitySearch", debouncedEntitySearch.trim());
            const { data } = await axios.get(`${changelogBase}?${params}`);
            if (!data.error) { setChanges(data.entries); setChangesTotal(data.total); setChangesPages(data.pages); }
        } catch (e) { console.error(e); }
        finally { setChangesLoading(false); }
    }, [provider, range, selectedUser, entityTypeFilter, changesPage, changelogBase, debouncedUserSearch, debouncedEntitySearch]);

    const loadErrors = useCallback(async () => {
        setErrorsLoading(true);
        try {
            const params = new URLSearchParams({ provider, range, page: errorsPage });
            const { data } = await axios.get(`${errorlogBase}?${params}`);
            if (!data.error) { setErrors(data.entries); setErrorsTotal(data.total); setErrorsPages(data.pages); }
        } catch (e) { console.error(e); }
        finally { setErrorsLoading(false); }
    }, [provider, range, errorsPage, errorlogBase]);

    useEffect(() => { if (tab === 0) loadActivity(); }, [loadActivity, tab]);
    useEffect(() => { if (tab === 1) loadChanges(); }, [loadChanges, tab]);
    useEffect(() => { if (tab === 2) loadErrors(); }, [loadErrors, tab]);

    // Debounce text search fields (400ms)
    useEffect(() => {
        const t = setTimeout(() => setDebouncedUserSearch(changeUserSearch), 400);
        return () => clearTimeout(t);
    }, [changeUserSearch]);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedEntitySearch(changeEntitySearch), 400);
        return () => clearTimeout(t);
    }, [changeEntitySearch]);

    useEffect(() => { setChangesPage(1); }, [range, selectedUser, entityTypeFilter, debouncedUserSearch, debouncedEntitySearch]);
    useEffect(() => { setErrorsPage(1); }, [range]);

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
                <>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Entity</InputLabel>
                        <Select value={entityTypeFilter} label="Entity" onChange={e => setEntityTypeFilter(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="blank">Blanks</MenuItem>
                            <MenuItem value="design">Designs</MenuItem>
                            <MenuItem value="product">Products</MenuItem>
                            <MenuItem value="item">Items (Repulls)</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" label="User" value={changeUserSearch}
                        onChange={e => setChangeUserSearch(e.target.value)}
                        sx={{ minWidth: 130 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                    />
                    <TextField
                        size="small" label="Code / Name" value={changeEntitySearch}
                        onChange={e => setChangeEntitySearch(e.target.value)}
                        sx={{ minWidth: 150 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                    />
                </>
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

            <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Activity" />
                <Tab label="Change History" />
                <Tab label="Errors" />
                <Tab label="Live" />
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
                                    {userNames.length > 1 && (() => {
                                        const grandTotal = userNames.reduce((s, u) => s + users[u].total, 0);
                                        return (
                                            <TableRow sx={{ bgcolor: "action.selected", "& td": { borderTop: "2px solid", borderColor: "divider" } }}>
                                                <TableCell><Typography fontWeight={700}>Totals</Typography></TableCell>
                                                {actionsPresent.map(a => {
                                                    const sum = userNames.reduce((s, u) => s + (users[u].actions[a] || 0), 0);
                                                    return (
                                                        <TableCell key={a} align="center">
                                                            {sum > 0
                                                                ? <Chip size="small" label={sum} color={ACTION_COLOR[a] ?? "default"} />
                                                                : <Typography color="text.disabled">—</Typography>}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell align="center"><Typography fontWeight={700}>{grandTotal}</Typography></TableCell>
                                            </TableRow>
                                        );
                                    })()}
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

            {/* ── Errors Tab ── */}
            {tab === 2 && (
                errorsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            {errorsTotal} error{errorsTotal !== 1 ? "s" : ""} in {rangeLabel.toLowerCase()}
                        </Typography>
                        <Paper variant="outlined" sx={{ overflow: "auto", mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "action.hover" }}>
                                        <TableCell><strong>Time</strong></TableCell>
                                        <TableCell><strong>Source</strong></TableCell>
                                        <TableCell><strong>Message</strong></TableCell>
                                        <TableCell><strong>Details</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {errors.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Typography color="text.secondary" py={2}>No errors in {rangeLabel.toLowerCase()}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : errors.map(entry => (
                                        <ErrorRow key={entry._id} entry={entry} />
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        {errorsPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <Pagination count={errorsPages} page={errorsPage} onChange={(_, p) => setErrorsPage(p)} color="primary" />
                            </Box>
                        )}
                    </>
                )
            )}

            {/* ── Live Tab ── */}
            {tab === 3 && <LiveUsers apiUrl={presenceBase} embedded />}
        </Box>
    );
}

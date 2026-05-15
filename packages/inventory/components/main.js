"use client";
import { useState } from "react";
import { Box, Grid2, TextField, Accordion, AccordionSummary, AccordionDetails, Button, Typography, Card, Chip, Stack, InputAdornment, Pagination, PaginationItem, Tooltip } from "@mui/material";
import axios from "axios";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { OrderModal } from "./orderModal";
import { DisplayModal } from "./display";
import { DeleteInventoryModal } from "./deleteInventoryModal";
import { Footer } from "@pythias/backend";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";

export function Main({ bla, it, defaultLocation, binType, cou, pa, q, totalValue }) {
    const [fullStyles, setFullStyles] = useState(bla);
    const [styles, setStyles]         = useState(bla);
    const [items, setItems]           = useState(it);
    const [open, setOpen]             = useState(false);
    const [openDisplay, setOpenDisplay] = useState(false);
    const [orderType, setOrderType]   = useState();
    const [page, setPage]             = useState(pa ?? 1);
    const [expanded, setExpanded]     = useState("");
    const [expandedColor, setExpandedColor] = useState("");
    const [inventories, setInventories] = useState([]);
    const [query, setQuery]           = useState(q);
    const [count, setCount]           = useState(cou);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [inventoryToDelete, setInventoryToDelete] = useState(null);

    const save = async (inventory) => {
        const res = await axios.post("/api/admin/inventory", { inventory });
        if (res?.data && !res.data.error) {
            setFullStyles(res.data.combined);
            setItems(res.data.items);
        } else alert("Error saving inventory");
    };

    const updateInventory = async ({ inventory, param, value }) => {
        const s = [...styles];
        const blank = s.find(s => s.blank._id.toString() === inventory.blank?.toString() || s.blank?.code === inventory.style_code);
        const inv = blank.inventories.find(iv => iv._id.toString() === inventory._id.toString());
        const isText = ["location", "row", "bin", "shelf", "unit"].includes(param);
        inv[param] = isText ? value : parseInt(value);
        setStyles([...s]);
        save(inv);
    };

    const search = async () => {
        const res = await axios.get(`/api/admin/inventory?q=${query}`);
        if (res.data) {
            setPage(1);
            setCount(res.data.count);
            setStyles(res.data.blanks);
        }
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 2, py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <WarehouseIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="baseline" spacing={1.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>Inventory</Typography>
                            <Tooltip title="Total cost value of all inventory (quantity × cost per size)">
                                <Chip
                                    label={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontFamily: "monospace" }}
                                />
                            </Tooltip>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Manage stock levels, locations, and orders</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button variant="outlined" size="small" startIcon={<AddShoppingCartIcon />} onClick={() => { setOrderType("Inventory Order"); setOpen(true); }}>
                            Inventory Order
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<ErrorOutlineIcon />} onClick={() => { setOrderType("Out Of Stock"); setOpen(true); }}>
                            Out Of Stock
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<ListAltIcon />} onClick={() => setOpenDisplay(true)}>
                            Orders
                        </Button>
                    </Stack>
                </Stack>

                {/* Search */}
                <TextField
                    fullWidth
                    placeholder="Search by style, name, color…"
                    size="small"
                    value={query ?? ""}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "text.disabled", cursor: "pointer" }} onClick={search} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Inventory list */}
            <Box sx={{ px: 2, py: 2, flex: 1 }}>
                {styles.map(s => (
                    <Accordion
                        key={s.blank._id}
                        expanded={expanded === s.blank.code}
                        onChange={() => setExpanded(expanded === s.blank.code ? "" : s.blank.code)}
                        variant="outlined"
                        sx={{ mb: 1.5, borderRadius: "12px !important", "&:before": { display: "none" }, overflow: "hidden" }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, mr: 1 }}>
                                <Chip label={s.blank.code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                                <Typography variant="body1" fontWeight={600}>{s.blank.name}</Typography>
                                {s.blank.department && (
                                    <Chip label={s.blank.department} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                                )}
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {s.blank.colors.map(si => (
                                <Accordion
                                    key={si._id}
                                    expanded={expanded === s.blank.code && expandedColor === si.name}
                                    onChange={() => {
                                        setExpandedColor(expandedColor === si.name ? "" : si.name);
                                        setInventories(s.inventories?.filter(i => i.color_name === si.name));
                                    }}
                                    disableGutters
                                    sx={{ "&:before": { display: "none" }, borderTop: "1px solid", borderColor: "divider" }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, bgcolor: "action.hover" }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, mr: 1 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>{si.name}</Typography>
                                            {(() => {
                                                const oosCount = s.inventories?.filter(i => i.color_name === si.name && i.quantity === 0).length ?? 0;
                                                return oosCount > 0
                                                    ? <Chip label={`${oosCount} OOS`} size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.65rem" }} />
                                                    : null;
                                            })()}
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 2, py: 1.5 }}>
                                        {/* Column headers */}
                                        <Grid2 container spacing={1} sx={{ px: 1, mb: 0.5 }}>
                                            <Grid2 size={1.5}><Typography variant="caption" fontWeight={700} color="text.secondary">Size</Typography></Grid2>
                                            <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Qty</Typography></Grid2>
                                            <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Min</Typography></Grid2>
                                            <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Order</Typography></Grid2>
                                            <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Pending</Typography></Grid2>
                                            <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">OOS</Typography></Grid2>
                                            {binType === "location" && <Grid2 size={2}><Typography variant="caption" fontWeight={700} color="text.secondary">Location</Typography></Grid2>}
                                            {binType === "row" && <>
                                                <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Row</Typography></Grid2>
                                                <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Unit</Typography></Grid2>
                                                <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Shelf</Typography></Grid2>
                                                <Grid2 size={1}><Typography variant="caption" fontWeight={700} color="text.secondary">Bin</Typography></Grid2>
                                            </>}
                                        </Grid2>

                                        {/* Inventory rows */}
                                        {expanded === s.blank.code && expandedColor === si.name && [...inventories].sort((a, b) => {
                                            if (a.size_name.length !== b.size_name.length) return a.size_name.length - b.size_name.length;
                                            return a.size_name < b.size_name ? 1 : -1;
                                        }).map(i => {
                                            const outOfStock = i.quantity === 0;
                                            const oos = i.attached?.length > 0;
                                            const belowMin = i.quantity < i.order_at_quantity;
                                            const isRed = outOfStock || oos;
                                            const rowBg = isRed ? "#fef2f2" : belowMin ? "#fffbeb" : "transparent";
                                            return (
                                                <Box
                                                    key={i._id}
                                                    sx={{ bgcolor: rowBg, borderRadius: 1.5, px: 1, py: 0.5, mb: 0.5, borderLeft: isRed ? "3px solid #ef4444" : belowMin ? "3px solid #f59e0b" : "3px solid transparent" }}
                                                >
                                                    <Grid2 container spacing={1} alignItems="center">
                                                        <Grid2 size={1.5}>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <Typography variant="body2" fontWeight={600} sx={{ textTransform: "uppercase" }}>{i.size_name}</Typography>
                                                                {outOfStock && <Chip label="OOS" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.6rem", height: 16, "& .MuiChip-label": { px: 0.5 } }} />}
                                                            </Stack>
                                                        </Grid2>
                                                        <Grid2 size={1}>
                                                            <TextField size="small" fullWidth type="number" value={i.quantity}
                                                                onChange={(e) => updateInventory({ inventory: i, param: "quantity", value: e.target.value })}
                                                                sx={{ "& input": { color: isRed ? "error.main" : belowMin ? "warning.main" : "inherit", fontWeight: 700 } }}
                                                            />
                                                        </Grid2>
                                                        <Grid2 size={1}>
                                                            <TextField size="small" fullWidth type="number" value={i.order_at_quantity}
                                                                onChange={(e) => updateInventory({ inventory: i, param: "order_at_quantity", value: e.target.value })} />
                                                        </Grid2>
                                                        <Grid2 size={1}>
                                                            <TextField size="small" fullWidth type="number" value={i.quantity_to_order}
                                                                onChange={(e) => updateInventory({ inventory: i, param: "quantity_to_order", value: e.target.value })} />
                                                        </Grid2>
                                                        <Grid2 size={1}>
                                                            <Typography variant="body2" textAlign="center" fontWeight={600}>
                                                                {i.orders?.reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0) ?? 0}
                                                            </Typography>
                                                        </Grid2>
                                                        <Grid2 size={1}>
                                                            <Typography variant="body2" textAlign="center" fontWeight={600} color={oos ? "error.main" : "text.primary"}>
                                                                {i.attached?.length ?? 0}
                                                            </Typography>
                                                        </Grid2>
                                                        {binType === "location" && (
                                                            <Grid2 size={2}>
                                                                <TextField size="small" fullWidth value={i.location ?? ""} placeholder="Not Set"
                                                                    onChange={(e) => updateInventory({ inventory: i, param: "location", value: e.target.value })} />
                                                            </Grid2>
                                                        )}
                                                        {binType === "row" && <>
                                                            <Grid2 size={1}>
                                                                <TextField size="small" fullWidth value={i.row ?? ""} placeholder="—"
                                                                    onChange={(e) => updateInventory({ inventory: i, param: "row", value: e.target.value })} />
                                                            </Grid2>
                                                            <Grid2 size={1}>
                                                                <TextField size="small" fullWidth value={i.unit ?? ""} placeholder="—"
                                                                    onChange={(e) => updateInventory({ inventory: i, param: "unit", value: e.target.value })} />
                                                            </Grid2>
                                                            <Grid2 size={1}>
                                                                <TextField size="small" fullWidth value={i.shelf ?? ""} placeholder="—"
                                                                    onChange={(e) => updateInventory({ inventory: i, param: "shelf", value: e.target.value })} />
                                                            </Grid2>
                                                            <Grid2 size={1}>
                                                                <TextField size="small" fullWidth value={i.bin ?? ""} placeholder="—"
                                                                    onChange={(e) => updateInventory({ inventory: i, param: "bin", value: e.target.value })} />
                                                            </Grid2>
                                                            <Grid2 size={1} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <DeleteIcon
                                                                    sx={{ cursor: "pointer", color: "error.main", fontSize: 20 }}
                                                                    onClick={() => { setInventoryToDelete(i); setDeleteModalOpen(true); }}
                                                                />
                                                            </Grid2>
                                                        </>}
                                                    </Grid2>
                                                </Box>
                                            );
                                        })}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>

            {/* Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <Pagination
                    count={count}
                    page={page}
                    variant="outlined"
                    shape="rounded"
                    renderItem={(item) => (
                        <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />
                    )}
                    onChange={(e, value) => {
                        window.location.href = `/inventory?page=${value}${query ? `&q=${query}` : ""}`;
                    }}
                />
            </Box>

            <DeleteInventoryModal
                open={deleteModalOpen} setOpen={setDeleteModalOpen}
                inventory={inventoryToDelete} setInventory={setInventoryToDelete}
                setStyles={setStyles} query={query} page={page}
                setExpandedColor={setExpandedColor}
            />
            <DisplayModal open={openDisplay} setOpen={setOpenDisplay} />
            <OrderModal
                open={open} setOpen={setOpen} type={orderType}
                blanks={fullStyles} items={items}
                setBlanks={setFullStyles} setItems={setItems}
                defaultLocation={defaultLocation}
            />
            <Footer fixed={true} />
        </Box>
    );
}

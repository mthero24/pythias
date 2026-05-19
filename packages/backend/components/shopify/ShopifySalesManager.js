"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Stack, Chip, IconButton, CircularProgress,
  Alert, Select, MenuItem, FormControl, InputLabel, TextField, Checkbox,
  FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Grid2,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const EMPTY_FORM = {
  name: "", discountType: "percent", discountValue: "", startDate: "", endDate: "",
  scope: "site", blankCode: "", blankName: "", designSku: "", designName: "",
  couponCode: "", newProductsOnly: false,
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function saleStatus(sale) {
  const now = Date.now();
  const start = new Date(sale.startDate).getTime();
  const end = new Date(sale.endDate).getTime();
  if (!sale.isActive || now > end) return { label: "Ended", color: "error" };
  if (now < start) return { label: "Upcoming", color: "warning" };
  return { label: "Active", color: "success" };
}

export default function ShopifySalesManager({ shop, shops = [], apiBase }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedShop, setSelectedShop] = useState(shop || "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedShop ? `${apiBase}?shop=${selectedShop}` : apiBase;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setSales(data.sales || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedShop]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (shop) setSelectedShop(shop); }, [shop]);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.name || !form.discountValue || !form.startDate || !form.endDate || !selectedShop) return;
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shop: selectedShop }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(apiBase, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: deleteTarget._id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight={700}>Sales</Typography>
          {shops.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Store</InputLabel>
              <Select value={selectedShop} label="Store" onChange={e => setSelectedShop(e.target.value)}>
                <MenuItem value="">All stores</MenuItem>
                {shops.map(s => <MenuItem key={s.shop} value={s.shop}>{s.shop}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}>
          New Sale
        </Button>
      </Stack>

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Sale</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {shops.length > 1 && (
              <FormControl fullWidth>
                <InputLabel>Store</InputLabel>
                <Select value={selectedShop} label="Store" onChange={e => setSelectedShop(e.target.value)}>
                  {shops.map(s => <MenuItem key={s.shop} value={s.shop}>{s.shop}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField label="Sale name" value={form.name} onChange={e => set("name")(e.target.value)} fullWidth />
            <Grid2 container spacing={2}>
              <Grid2 size={6}>
                <FormControl fullWidth>
                  <InputLabel>Discount type</InputLabel>
                  <Select value={form.discountType} label="Discount type" onChange={e => set("discountType")(e.target.value)}>
                    <MenuItem value="percent">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={6}>
                <TextField
                  label={form.discountType === "percent" ? "Discount (%)" : "Discount ($)"}
                  type="number" value={form.discountValue}
                  onChange={e => set("discountValue")(e.target.value)} fullWidth
                />
              </Grid2>
            </Grid2>
            <Grid2 container spacing={2}>
              <Grid2 size={6}>
                <TextField label="Start date" type="date" value={form.startDate} onChange={e => set("startDate")(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid2>
              <Grid2 size={6}>
                <TextField label="End date" type="date" value={form.endDate} onChange={e => set("endDate")(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid2>
            </Grid2>
            <FormControl fullWidth>
              <InputLabel>Scope</InputLabel>
              <Select value={form.scope} label="Scope"
                onChange={e => setForm(f => ({ ...f, scope: e.target.value, blankCode: "", designSku: "" }))}>
                <MenuItem value="site">Site-wide</MenuItem>
                <MenuItem value="blank">By blank</MenuItem>
                <MenuItem value="design">By design</MenuItem>
              </Select>
            </FormControl>
            {form.scope === "blank" && (
              <TextField label="Blank code" value={form.blankCode} onChange={e => set("blankCode")(e.target.value)} fullWidth placeholder="e.g. 5000" />
            )}
            {form.scope === "design" && (
              <TextField label="Design SKU" value={form.designSku} onChange={e => set("designSku")(e.target.value)} fullWidth />
            )}
            <TextField
              label="Coupon code (optional)"
              value={form.couponCode}
              onChange={e => set("couponCode")(e.target.value.toUpperCase())}
              fullWidth
              placeholder="e.g. SUMMER20"
              helperText={form.couponCode ? "Creates a Shopify checkout discount code." : "Leave empty for automatic price strikethrough."}
            />
            <FormControlLabel
              control={<Checkbox checked={form.newProductsOnly} onChange={e => set("newProductsOnly")(e.target.checked)} />}
              label="Apply to new products only"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={16} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete sale?</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{deleteTarget?.name}</strong>? This will revert all affected product prices.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : sales.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No sales yet. Create one to get started.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Store</strong></TableCell>
                <TableCell><strong>Discount</strong></TableCell>
                <TableCell><strong>Dates</strong></TableCell>
                <TableCell><strong>Scope</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map(sale => {
                const status = saleStatus(sale);
                return (
                  <TableRow key={sale._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{sale.name}</Typography>
                      {sale.couponCode && <Chip label={sale.couponCode} size="small" color="secondary" sx={{ mt: 0.5 }} />}
                    </TableCell>
                    <TableCell><Typography variant="body2">{sale.shop}</Typography></TableCell>
                    <TableCell>{sale.discountValue}{sale.discountType === "percent" ? "%" : "$"} off</TableCell>
                    <TableCell>
                      <Typography variant="caption">{fmtDate(sale.startDate)}</Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">→ {fmtDate(sale.endDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      {sale.scope === "site" ? "Site-wide" :
                       sale.scope === "blank" ? `Blank: ${sale.blankName || sale.blankCode}` :
                       `Design: ${sale.designName || sale.designSku}`}
                    </TableCell>
                    <TableCell><Chip label={status.label} size="small" color={status.color} /></TableCell>
                    <TableCell padding="checkbox">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(sale)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

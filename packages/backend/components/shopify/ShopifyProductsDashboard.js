"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Stack, CircularProgress, Alert, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Pagination, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function ShopifyProductsDashboard({ shop, apiBase, shops = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedShop, setSelectedShop] = useState(shop || "");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page });
      if (selectedShop) params.set("shop", selectedShop);
      const res = await fetch(`${apiBase}?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setProducts(data.products || []);
      setPages(data.pages || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedShop, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (shop) setSelectedShop(shop); }, [shop]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Synced Products</Typography>
        {shops.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Store</InputLabel>
            <Select value={selectedShop} label="Store" onChange={e => { setSelectedShop(e.target.value); setPage(1); }}>
              <MenuItem value="">All stores</MenuItem>
              {shops.map(s => <MenuItem key={s.shop} value={s.shop}>{s.shop}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No synced products found.</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>SKU</strong></TableCell>
                  <TableCell><strong>Store</strong></TableCell>
                  <TableCell><strong>Shopify ID</strong></TableCell>
                  <TableCell><strong>Variants</strong></TableCell>
                  <TableCell><strong>Published</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p._id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.sku}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{p.shop}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {p.shopifyProduct?.productId?.split("/").pop() || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.shopifyProduct?.variantIds?.length ?? "—"}</TableCell>
                    <TableCell>
                      {p.shopifyProduct?.published
                        ? <CheckCircleIcon color="success" fontSize="small" />
                        : <CancelIcon color="disabled" fontSize="small" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {pages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

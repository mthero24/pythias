"use client";
import { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress, Alert, Container, Typography, Stack } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShopifySalesManager from "./ShopifySalesManager";

export function ShopifySalesPage({ apiBase = "/api/admin/shopify" }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadShops = useCallback(async () => {
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setShops(data.shops ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { loadShops(); }, [loadShops]);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <LocalOfferIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h6" fontWeight={700}>Sales</Typography>
          <Typography variant="caption" color="text.secondary">
            Manage Shopify sales and discounts across connected stores
          </Typography>
        </Box>
      </Stack>
      {shops.length === 0 ? (
        <Alert severity="info">No Shopify stores connected yet.</Alert>
      ) : (
        <ShopifySalesManager shops={shops} apiBase={`${apiBase}/sales`} />
      )}
    </Container>
  );
}

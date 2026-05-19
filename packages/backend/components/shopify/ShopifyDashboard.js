"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Typography, Grid2, Card, CardContent, Chip, Stack,
  Button, Tabs, Tab, CircularProgress, Alert, Divider,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShopifySalesManager from "./ShopifySalesManager";
import ShopifyProductsDashboard from "./ShopifyProductsDashboard";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function SaleStatusChip({ sale }) {
  const now = Date.now();
  const start = new Date(sale.startDate).getTime();
  const end = new Date(sale.endDate).getTime();
  if (!sale.isActive || now > end) return <Chip label="Ended" size="small" color="error" />;
  if (now < start) return <Chip label="Upcoming" size="small" color="warning" />;
  return <Chip label="Active" size="small" color="success" />;
}

function ShopCard({ shop, onSelect, selected }) {
  return (
    <Card
      onClick={() => onSelect(shop.shop)}
      sx={{
        cursor: "pointer",
        border: "2px solid",
        borderColor: selected ? "primary.main" : "divider",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <StorefrontIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700} noWrap>{shop.shop}</Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Box textAlign="center">
            <Typography variant="h6" color="success.main" fontWeight={700}>{shop.activeSales}</Typography>
            <Typography variant="caption" color="text.secondary">Active Sales</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700}>{shop.totalProducts}</Typography>
            <Typography variant="caption" color="text.secondary">Products</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ShopifyDashboard({ apiBase = "/api/admin/shopify" }) {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      setShops(data.shops);
      if (data.shops.length === 1) setSelectedShop(data.shops[0].shop);
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
        <StorefrontIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h6" fontWeight={700}>Shopify Dashboard</Typography>
          <Typography variant="caption" color="text.secondary">
            Manage sales, products, and inventory across connected stores
          </Typography>
        </Box>
      </Stack>

      {shops.length === 0 ? (
        <Alert severity="info">No Shopify stores connected yet. Connect a store from the Shopify app.</Alert>
      ) : (
        <>
          {/* Store selector */}
          <Typography variant="overline" color="text.secondary" display="block" mb={1}>Connected Stores</Typography>
          <Grid2 container spacing={2} mb={3}>
            {shops.map(shop => (
              <Grid2 key={shop.shop} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ShopCard shop={shop} onSelect={setSelectedShop} selected={selectedShop === shop.shop} />
              </Grid2>
            ))}
          </Grid2>

          <Divider sx={{ mb: 3 }} />

          {/* Tab navigation */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab icon={<LocalOfferIcon fontSize="small" />} iconPosition="start" label="Sales" />
            <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Products" />
          </Tabs>

          {tab === 0 && (
            <ShopifySalesManager
              shop={selectedShop}
              shops={shops}
              apiBase={`${apiBase}/sales`}
            />
          )}
          {tab === 1 && (
            <ShopifyProductsDashboard
              shop={selectedShop}
              apiBase={`${apiBase}/products`}
            />
          )}
        </>
      )}
    </Container>
  );
}

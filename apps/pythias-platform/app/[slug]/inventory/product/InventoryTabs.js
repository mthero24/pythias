"use client";
import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { ProductMain } from "@pythias/inventory";
import { CatalogInventory } from "@pythias/backend";

// Tabbed product inventory: "Made" (POD PlatformInventory) vs "Bought & imported" (catalog products,
// stock on the variant). ProductMain stays mounted (display toggle) so its filters/paging persist.
export default function InventoryTabs({ podProps, catalogProducts = [] }) {
    const [tab, setTab] = useState(0);
    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab label="Made products" />
                    <Tab label={`Bought & imported${catalogProducts.length ? ` (${catalogProducts.length})` : ""}`} />
                </Tabs>
            </Box>
            <Box sx={{ display: tab === 0 ? "block" : "none" }}><ProductMain {...podProps} /></Box>
            {tab === 1 && <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2 }}><CatalogInventory products={catalogProducts} /></Box>}
        </Box>
    );
}

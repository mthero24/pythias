"use client";
import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";

// Pure tab shell. The two panels (POD ProductMain, catalog CatalogInventory) are rendered by the
// server page and passed in as props — so this client component doesn't pull server-only modules
// (node:crypto) into the client bundle. Both stay mounted (display toggle) to preserve state.
export default function InventoryTabs({ made, bought, boughtCount = 0 }) {
    const [tab, setTab] = useState(0);
    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab label="Made products" />
                    <Tab label={`Bought & imported${boughtCount ? ` (${boughtCount})` : ""}`} />
                </Tabs>
            </Box>
            <Box sx={{ display: tab === 0 ? "block" : "none" }}>{made}</Box>
            <Box sx={{ display: tab === 1 ? "block" : "none" }}>{bought}</Box>
        </Box>
    );
}

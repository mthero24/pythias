"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";

// Click-to-copy monospace text (used for stripeCustomerId in the founders list).
export default function CopyText({ value }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            /* clipboard unavailable — no-op */
        }
    };

    return (
        <Tooltip title={copied ? "Copied!" : "Click to copy"}>
            <Box
                component="span"
                onClick={handleCopy}
                sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    borderBottom: "1px dotted",
                    borderColor: "divider",
                    "&:hover": { color: "primary.main" },
                }}
            >
                {value}
            </Box>
        </Tooltip>
    );
}

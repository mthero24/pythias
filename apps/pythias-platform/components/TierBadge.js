import { Chip, Stack } from "@mui/material";
import { TIERS } from "@/lib/tiers";

const TIER_COLORS = {
    starter: "default",
    professional: "primary",
    business: "secondary",
    scale: "success",
    enterprise: "warning",
};

export default function TierBadge({ tier, status }) {
    const label = TIERS[tier]?.label ?? tier;
    return (
        <Stack direction="row" spacing={0.5}>
            <Chip label={label} size="small" color={TIER_COLORS[tier] ?? "default"} variant="outlined" sx={{ color: "#D3A73D", borderColor: "rgba(211,167,61,0.45)" }} />
            {status === "trial" && <Chip label="Trial" size="small" variant="outlined" color="info" />}
            {status === "suspended" && <Chip label="Suspended" size="small" color="error" />}
        </Stack>
    );
}

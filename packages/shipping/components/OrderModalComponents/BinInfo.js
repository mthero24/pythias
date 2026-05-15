import { Typography, Button, Stack, Chip, Divider } from "@mui/material";
import axios from "axios";

export function BinInfo({ bin, close, setBins }) {
    const Clear = async () => {
        const res = await axios.delete(`/api/production/shipping/bins?number=${bin.number}`);
        if (res.data.error) alert(res.data.msg);
        else {
            setBins(res.data.bins);
            close();
        }
    };

    const remaining = bin.order.items.filter(i => !i.canceled && !i.shipped).length - bin.items.length;

    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
            <Divider orientation="vertical" flexItem />
            <Chip
                label={`Bin #${bin.number}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
            />
            <Chip label={`${bin.items.length} in bin`} size="small" variant="outlined" />
            <Chip
                label={`${remaining} remaining`}
                size="small"
                variant="outlined"
                color={remaining > 0 ? "warning" : "success"}
            />
            <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={Clear}
                sx={{ whiteSpace: "nowrap", fontSize: "0.72rem", py: 0.25 }}
            >
                Clear Bin
            </Button>
        </Stack>
    );
}

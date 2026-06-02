import { Main } from "@pythias/embroidery";
import { Box } from "@mui/material";
import { Settings } from "@pythias/mongo";

export default async function Embroidery() {
    let printers = [];
    try {
        const doc = await Settings.findOne({ key: "production" }).lean();
        const prod = doc?.value ? JSON.parse(doc.value) : {};
        printers = prod.embroideryMachines ?? [];
    } catch {}
    return (
        <Box sx={{ padding: "3%", background: "#e2e2e2", minHeight: "92vh" }}>
            <Main printers={printers} />
        </Box>
    );
}
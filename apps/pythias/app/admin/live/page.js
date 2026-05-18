import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LiveUsers } from "@pythias/backend";
import { Box, Typography } from "@mui/material";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live Users — Pythias Admin" };

export default async function LiveUsersPage() {
    const headersList = await headers();
    const user = headersList.get("user");
    if (!user) redirect("/login");

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                    Live Users
                </Typography>
                <Typography sx={{ color: "rgba(0,0,0,0.45)", mt: 0.5, fontSize: 14 }}>
                    Real-time user presence
                </Typography>
            </Box>
            <LiveUsers apiUrl="/api/admin/users/presence" />
        </Box>
    );
}

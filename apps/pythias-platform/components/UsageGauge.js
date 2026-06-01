import { Card, CardContent, Box, Typography, LinearProgress } from "@mui/material";

export default function UsageGauge({ label, current, limit }) {
    const unlimited = limit === -1;
    const pct = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
    const color = pct >= 100 ? "error" : pct >= 90 ? "warning" : "primary";

    return (
        <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }}>
                    {current.toLocaleString()}
                </Typography>
                {unlimited ? (
                    <Typography variant="caption" color="success.main">Unlimited</Typography>
                ) : (
                    <>
                        <LinearProgress
                            variant="determinate"
                            value={pct}
                            color={color}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            of {limit.toLocaleString()} ({pct}%)
                        </Typography>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

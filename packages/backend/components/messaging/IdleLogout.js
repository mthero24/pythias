"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, LinearProgress, Box,
} from "@mui/material";
import axios from "axios";

const IDLE_MS       = 15 * 60 * 1000;  // 15 minutes
const WARN_MS       = 14 * 60 * 1000;  // show warning at 14 min
const WARN_DURATION = 60;              // seconds of warning countdown
const HEARTBEAT_MS  = 60 * 1000;       // ping every 60 seconds

export function IdleLogout() {
    const { data: session } = useSession();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown]     = useState(WARN_DURATION);

    const idleTimer     = useRef(null);
    const warnTimer     = useRef(null);
    const countdownRef  = useRef(null);
    const resetRef      = useRef(null);

    const doLogout = useCallback(() => signOut({ callbackUrl: "/login" }), []);

    useEffect(() => {
        if (!session?.user?.userName) return;

        const logout = doLogout;

        const reset = () => {
            clearTimeout(idleTimer.current);
            clearTimeout(warnTimer.current);
            clearInterval(countdownRef.current);
            setShowWarning(false);
            setCountdown(WARN_DURATION);

            warnTimer.current = setTimeout(() => {
                setShowWarning(true);
                setCountdown(WARN_DURATION);
                countdownRef.current = setInterval(() => {
                    setCountdown(c => {
                        if (c <= 1) {
                            clearInterval(countdownRef.current);
                            logout();
                            return 0;
                        }
                        return c - 1;
                    });
                }, 1000);
            }, WARN_MS);

            idleTimer.current = setTimeout(logout, IDLE_MS);
        };

        resetRef.current = reset;

        const EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"];
        EVENTS.forEach(e => document.addEventListener(e, reset, { passive: true }));
        reset();

        return () => {
            clearTimeout(idleTimer.current);
            clearTimeout(warnTimer.current);
            clearInterval(countdownRef.current);
            EVENTS.forEach(e => document.removeEventListener(e, reset));
        };
    }, [session?.user?.userName, doLogout]);

    // Heartbeat: updates lastSeen + validates session token
    useEffect(() => {
        if (!session?.user?.userName) return;

        const ping = async () => {
            try {
                const res = await axios.post("/api/heartbeat");
                if (!res.data?.valid) doLogout();
            } catch {}
        };

        ping();
        const id = setInterval(ping, HEARTBEAT_MS);
        return () => clearInterval(id);
    }, [session?.user?.userName, doLogout]);

    if (!session?.user) return null;

    const progress = ((WARN_DURATION - countdown) / WARN_DURATION) * 100;

    return (
        <Dialog open={showWarning} maxWidth="xs" fullWidth disableEscapeKeyDown>
            <DialogTitle sx={{ fontWeight: 700 }}>Still there?</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You've been inactive. You'll be automatically signed out in{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {countdown} second{countdown !== 1 ? "s" : ""}
                    </Box>.
                </Typography>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    color="error"
                    sx={{ borderRadius: 1, height: 6 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button color="error" onClick={doLogout}>
                    Sign out
                </Button>
                <Button variant="contained" onClick={() => resetRef.current?.()} autoFocus>
                    Stay signed in
                </Button>
            </DialogActions>
        </Dialog>
    );
}

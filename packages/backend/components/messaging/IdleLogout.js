"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, LinearProgress, Box, Divider,
} from "@mui/material";
import axios from "axios";
import { Main as LoginMain } from "../login/Main";

const IDLE_MS       = 15 * 60 * 1000;
const WARN_MS       = 14 * 60 * 1000;
const WARN_DURATION = 60;
const HEARTBEAT_MS  = 60 * 1000;

const fullSignOut = () =>
    signOut({ callbackUrl: `${window.location.origin}/login` });

export function IdleLogout({ name, initials, tagline }) {
    const { data: session } = useSession();
    const [showWarning,  setShowWarning]  = useState(false);
    const [showRelogin,  setShowRelogin]  = useState(false);
    const [reloginMsg,   setReloginMsg]   = useState("");
    const [countdown,    setCountdown]    = useState(WARN_DURATION);

    const idleTimer    = useRef(null);
    const warnTimer    = useRef(null);
    const countdownRef = useRef(null);
    const resetRef     = useRef(null);

    const clearTimers = useCallback(() => {
        clearTimeout(idleTimer.current);
        clearTimeout(warnTimer.current);
        clearInterval(countdownRef.current);
    }, []);

    // Show re-login overlay without navigating away
    const requireRelogin = useCallback((msg = "") => {
        clearTimers();
        setShowWarning(false);
        setReloginMsg(msg);
        setShowRelogin(true);
    }, [clearTimers]);

    const onReloginSuccess = useCallback(() => {
        setShowRelogin(false);
        setReloginMsg("");
        resetRef.current?.();
    }, []);

    useEffect(() => {
        if (!session?.user?.userName) return;

        const reset = () => {
            clearTimers();
            setShowWarning(false);
            setCountdown(WARN_DURATION);

            warnTimer.current = setTimeout(() => {
                setShowWarning(true);
                setCountdown(WARN_DURATION);
                countdownRef.current = setInterval(() => {
                    setCountdown(c => {
                        if (c <= 1) {
                            clearInterval(countdownRef.current);
                            requireRelogin("Your session expired due to inactivity.");
                            return 0;
                        }
                        return c - 1;
                    });
                }, 1000);
            }, WARN_MS);

            idleTimer.current = setTimeout(
                () => requireRelogin("Your session expired due to inactivity."),
                IDLE_MS
            );
        };

        resetRef.current = reset;

        const EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"];
        EVENTS.forEach(e => document.addEventListener(e, reset, { passive: true }));
        reset();

        return () => {
            clearTimers();
            EVENTS.forEach(e => document.removeEventListener(e, reset));
        };
    }, [session?.user?.userName, clearTimers, requireRelogin]);

    // Heartbeat: validates session token
    useEffect(() => {
        if (!session?.user?.userName) return;

        const ping = async () => {
            try {
                const res = await axios.post("/api/heartbeat");
                if (!res.data?.valid) {
                    requireRelogin(
                        res.data?.reason === "new_device"
                            ? "You were signed in on another device. Please sign in again."
                            : "Your session is no longer valid."
                    );
                }
            } catch {}
        };

        ping();
        const id = setInterval(ping, HEARTBEAT_MS);
        return () => clearInterval(id);
    }, [session?.user?.userName, requireRelogin]);

    if (!session?.user) return null;

    const progress = ((WARN_DURATION - countdown) / WARN_DURATION) * 100;

    return (
        <>
            {/* Idle warning dialog */}
            <Dialog open={showWarning && !showRelogin} maxWidth="xs" fullWidth disableEscapeKeyDown>
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
                    <Button color="error" onClick={fullSignOut}>Sign out</Button>
                    <Button variant="contained" onClick={() => resetRef.current?.()} autoFocus>
                        Stay signed in
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Re-login overlay — page stays mounted behind it */}
            <Dialog open={showRelogin} fullScreen disableEscapeKeyDown>
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    {reloginMsg && (
                        <Box sx={{ bgcolor: "#fef3c7", px: 3, py: 1.5, borderBottom: "1px solid #fcd34d" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#92400e" }}>
                                {reloginMsg}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                        <LoginMain
                            type="login"
                            name={name}
                            initials={initials}
                            tagline={tagline}
                            onSuccess={onReloginSuccess}
                        />
                    </Box>
                    <Divider />
                    <Box sx={{ px: 3, py: 1.5, display: "flex", justifyContent: "flex-end" }}>
                        <Button color="error" size="small" onClick={fullSignOut}>
                            Sign out completely
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}

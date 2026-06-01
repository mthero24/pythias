"use client";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo } from "react";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#1a1a2e" },
        secondary: { main: "#e94560" },
    },
    typography: {
        fontFamily: "Arial, Helvetica, sans-serif",
    },
});

export function AppThemeProvider({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

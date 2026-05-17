"use client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { SessionProvider } from "next-auth/react";

const theme = createTheme({
    typography: {
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
        borderRadius: 8,
    },
    palette: {
        primary: {
            main: "#6366f1",
            light: "#818cf8",
            dark: "#4f46e5",
            contrastText: "#fff",
        },
        success: {
            main: "#10b981",
            contrastText: "#fff",
        },
        warning: {
            main: "#f59e0b",
            contrastText: "#fff",
        },
        error: {
            main: "#ef4444",
            contrastText: "#fff",
        },
        background: {
            default: "#f7f8fc",
            paper: "#ffffff",
        },
        divider: "rgba(0,0,0,0.08)",
        text: {
            primary: "#111827",
            secondary: "#6b7280",
            disabled: "#9ca3af",
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: "#f7f8fc",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(0,0,0,0.15) transparent",
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
                },
            },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                    letterSpacing: 0,
                },
                sizeSmall:  { padding: "4px 12px",  fontSize: "0.8125rem" },
                sizeMedium: { padding: "7px 18px",   fontSize: "0.875rem"  },
                sizeLarge:  { padding: "10px 24px",  fontSize: "0.9375rem" },
            },
        },
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: "1px solid rgba(0,0,0,0.08)",
                    backgroundImage: "none",
                },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: { backgroundImage: "none" },
                rounded: { borderRadius: 12 },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: { fontWeight: 700, fontSize: "1rem" },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 6, fontWeight: 500 },
                sizeSmall: { height: 22, fontSize: "0.72rem" },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: "#fff",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#6366f1",
                    },
                },
                notchedOutline: {
                    borderColor: "rgba(0,0,0,0.15)",
                },
                input: {
                    padding: "8.5px 14px",
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: { fontSize: "0.875rem" },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: "rgba(0,0,0,0.07)" },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: { backgroundImage: "none" },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    backgroundColor: "#1a1f2e",
                    padding: "5px 10px",
                },
                arrow: { color: "#1a1f2e" },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: { borderRadius: 8 },
            },
        },
        MuiAccordion: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px !important",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": { margin: 0 },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderColor: "rgba(0,0,0,0.07)" },
                head: { fontWeight: 700, backgroundColor: "#f7f8fc" },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 8 },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: { fontWeight: 700 },
            },
        },
    },
});

export function AppThemeProvider({ children }) {
    return (
        <SessionProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </SessionProvider>
    );
}

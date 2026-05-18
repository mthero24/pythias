"use client";

import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { muiTheme } from "@/lib/theme";
import { SessionProvider } from "next-auth/react";

export default function ThemeProvider({ children }) {
  return (
    <SessionProvider>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </SessionProvider>
  );
}

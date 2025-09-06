import { createTheme } from "@mui/material/styles";

export const Theme = {
  colors: {
    primary: "#1a1a1a",
    black: "#1a1a1a",
    secondary: "#BDA35B",
    white: "#ffffff",
  },
};

// Create the MUI theme with Urbanist font
export const muiTheme = createTheme({
  typography: {
    fontFamily: "var(--font-urbanist), sans-serif",
    h1: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 600,
    },
    h3: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 600,
    },
    h4: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 500,
    },
    h5: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 500,
    },
    h6: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 500,
    },
    subtitle1: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
    subtitle2: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
    body1: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
    body2: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
    button: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 500,
      textTransform: "none", // Disable uppercase transformation
    },
    caption: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
    overline: {
      fontFamily: "var(--font-urbanist), sans-serif",
      fontWeight: 400,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#1a1a1a",
      light: "#404040",
      dark: "#0d0d0d",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#C19F66",
      light: "#D4B887",
      dark: "#A67C52",
      contrastText: "#ffffff",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    text: {
      primary: "#171717",
      secondary: "#666666",
    },
    divider: "#e5e7eb",
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    // Override MUI component styles to ensure Urbanist is used
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "var(--font-urbanist), sans-serif",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: "var(--font-urbanist), sans-serif",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          padding: "8px 16px",
        },
        sizeLarge: {
          padding: "12px 24px",
          fontSize: "1rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default muiTheme;

import { createTheme } from "@mui/material";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  style: ["normal", "italic"],
  subsets: ["latin"],
});


export const theme = createTheme({
  typography: {
    fontFamily: [poppins.style.fontFamily, "Helvetica Neue", "Arial", "sans-serif"].join(
      ","
    ),
    h1: {
      fontSize: 56,
    },
    body: {
      fontSize: 18
    },
    label: {
      color: '#0079DC',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontSize: 14,
      fontWeight: 900
    }
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0px 3px 1px -2px rgba(0,0,0,0.0),0px 2px 2px 0px rgba(0,0,0,0.06),0px 1px 5px 0px rgba(0,0,0,0.1)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  ],
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1300,
      xl: 1536
    }
  },
  palette: {
    primary: {
      main: '#000000ff',
      contrastText: "#fff",
      faded: '#0079DC55'
    },
    background: {
      default: "#FFFFFF",
      dark: "#F1F1F1",
      light: "#FEFEFE",
      inverse: "#0B1929",
    },
    text: {
      inverse: "#fff",
    },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'white' },
          style: {
            backgroundColor: 'white',
            color: '#212121',
          }
        },
      ],
      styleOverrides: {
        root: {
          padding: '12px 24px',
          fontWeight: 700,
          textTransform: 'capitalize',
          boxShadow: 'none',
          transition:'all 0.3s',
          '&:hover': {
            boxShadow: 'none',
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFF",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#FAFAFA",
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
        }
      }
    }
  },
  logo: '/images/logo.png'
});


export const themeDark = createTheme({
  ...theme,
  palette: {
    mode: "dark",
    background: {
      default: "#0B1929",
      light: "#0d1f33",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0B1929",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0B1929",
        }
      }
    }
  },
  logo: '/images/logo-light.png'
});

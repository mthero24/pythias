import {Box} from "@mui/material";
import Link from "next/link";



export function Footer({fixed}) {
    return (
        <Box sx={{
            width: "100%",
            height: "250px",
            background: "#000",
            color: "#fff",
            display: "flex",
            position: "static",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bottom: 0,
            left: 0,
            boxShadow: "0 -1px 5px rgba(0,0,0,0.1)",
            padding: "6%"
        }}>
            <Box sx={{display: "flex", alignItems: "center",}}>
                <Link href="https://www.pythiastechnologies.com" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none", color: "#fff"}}>
                    <img src="https://www.pythiastechnologies.com/logo.png" alt="Pythias Logo" style={{width: "150px", marginRight: "10px"}} />
                </Link>
            </Box>
            <Box sx={{textAlign: "center", marginBottom: "1%"}}>
                © {new Date().getFullYear()} Pythias Technologies, LLC
            </Box>
        </Box>
    );
}
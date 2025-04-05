import Image from "next/image";
import {Box, Typography} from "@mui/material"
import * as logo from "@/public/logo.png"
export default function Home() {
  return (
    <Box sx={{ background: "#e2e2e2", height: "100vh",}}>
      <Box sx={{background: "#000", display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "1% 12%"}}>
        <Box sx={{width: "50%", padding: "3%"}}>
          <Image src={logo} alt="pythias technologies logo" width={700} height={700} style={{width: "60%", height: "auto"}} />
        </Box>
        <Box sx={{width: "50%", padding: "3%", textAlign: "center", margin: "5% 3%", color: "#e2e2e2"}}>
          <Typography fontSize={{xs: ".6rem", sm: ".7rem", md: "1.7rem"}}>Simplify Everything with One Platform. Automate, Scale, and Succeed.</Typography>
        </Box>
      </Box>
    </Box>
     
  );
}

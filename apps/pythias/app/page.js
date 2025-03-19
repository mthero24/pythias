import Image from "next/image";
import {Box} from "@mui/material"
import * as logo from "@/public/logo.png"
export default function Home() {
  return (
    <Box sx={{background: "#000", display: "flex", flexDirection: "row", justifyContent: "center", padding: "1% 12%", maxHeight: "100vh"}}>
      <Image src={logo} alt="pythias technologies logo" width={700} height={700} style={{width: "60%", height: "auto"}} />
    </Box>
     
  );
}

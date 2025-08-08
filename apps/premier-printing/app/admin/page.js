
import {Box, Grid2}from "@mui/material"
export default function Admin(){
    return(<Box sx={{padding: "3%"}}>
        <Grid2 container spacing={2}>
            <Grid2 size={12}>
                {console.log("Loading admin page")}
                 <iframe style={{background: "#FFFFFF", border: "none", borderRadius: "2px", boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)", width: "100%", marginTop: "2%"}} width="640" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=b1fca3f9-ef86-4071-87b2-990725529fd5&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Grid2>
            <Grid2 size={12}>
                <iframe style={{background: "#FFFFFF", border: "none", borderRadius: "2px", boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)", width: "100%", marginTop: "2%"}} width="640" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=85e7b092-a230-42bc-8d85-07d4188cc23d&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Grid2> 
            <Grid2 size={12}>
                <iframe style={{background: "#FFFFFF", border: "none", borderRadius: "2px", boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)", width: "100%", marginTop: "2%"}} width="640" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=edb7219a-7377-4540-9d58-36c6dd7751e6&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Grid2> 
        </Grid2> 
    </Box>)
}
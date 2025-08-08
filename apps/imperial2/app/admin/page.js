import {Box} from "@mui/material"
export default function Admin(){
    return(<Box>
            <h1 style={{fontSize: "3rem", textAlign: "center"}}>Admin Page</h1>
            <Box sx={{margin: "2%"}}>
                <iframe style={{background: "#FFFFFF", border: "none",borderRadius: "2px",boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)" }}width="100%" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=d45c5555-2b2f-480b-87a0-738b23c5055e&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Box>
            <Box sx={{margin: "2%"}}>
                <iframe style={{background: "#FFFFFF", border: "none",borderRadius: "2px",boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)" }}width="100%" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=9e331407-fdac-48ab-a911-4fcf6aa518af&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Box>
            <Box sx={{margin: "2%"}}>
                <iframe style={{background: "#FFFFFF", border: "none",borderRadius: "2px",boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)" }}width="100%" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=178b1add-e511-43cb-93cf-f57d542b9ba1&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Box>
            <Box sx={{margin: "2%"}}>
                <iframe style={{background: "#FFFFFF", border: "none",borderRadius: "2px",boxShadow: "0 2px 10px 0 rgba(70, 76, 79, .2)" }}width="100%" height="480" src="https://charts.mongodb.com/charts-pythias-tech-ckbsbme/embed/charts?id=33864785-cb95-4c3e-939e-77ac77ab7d78&maxDataAge=3600&theme=light&autoRefresh=true"></iframe>
            </Box>
    </Box>)
}
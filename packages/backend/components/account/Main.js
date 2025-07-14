import {Box, Typography, Container} from "@mui/material";
import {Footer} from "../reusable/Footer";
export function Main({user}){
    return (
        <Box>
            <Container maxWidth={"lg"} sx={{minHeight: "70vh"}}>
                <Box sx={{padding: "2%"}}>
                    <Typography fontSize="2rem" fontWeight={"bold"} textAlign={"center"}>Welcome {user.firstName || user.lastName? `${user.firstName} ${user.lastName}`: user.userName}</Typography>
                </Box>
            </Container>
            <Footer fixed={true}/>
        </Box>
    )
}
import {Box, Typography, Container} from "@mui/material";

export function Main({user}){
    return (
        <Container maxWidth={"lg"}>
            <Box sx={{padding: "2%"}}>
                <Typography fontSize="2rem" fontWeight={"bold"} textAlign={"center"}>Welcome {user.firstName || user.lastName? `${user.firstName} ${user.lastName}`: user.userName}</Typography>
            </Box>
        </Container>
    )
}
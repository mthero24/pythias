import {Box, Container, Typography} from "@mui/material";


export default function NotFound() {
    return (
        <Container>
            <Box textAlign="center" mt={5}>
                <Typography variant="h1" component="h1" gutterBottom>
                    404 - Not Found
                </Typography>
                <Typography variant="body1">
                    Sorry, the page you are looking for does not exist.
                </Typography>
            </Box>
        </Container>
    );
}
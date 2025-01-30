"use client";
import {Grid2, Box, Typography, Card} from "@mui/material"
export function Printers({printers, printer, setPrinter, setAuto}){
    return (
      <Box sx={{ display: "flex", flexDirection: "row", paddingTop: "1%" }}>
        <Box
          sx={{
            width: { xs: "99%", sm: "96%", md: "90%" },
            marginBottom: "1%",
            marginLeft: { xs: ".5%", sm: "2%", md: "5%" },
            height: { xs: "65px", sm: "85px", md: "75px", lg: "90px", xl: "100px" },
            overflow: {xs:"auto", sm: "hidden"},
          }}
        >
          <Grid2 container spacing={2} sx={{ marginBottom: "1%" }}>
            {printers &&
              printers.map((s) => (
                <Grid2 size={{ md: 2, sm: 3, xs: 6 }} key={s}>
                  <Card
                    sx={{
                      padding: { xs: "3%", md: "10%" },
                      background: printer == s ? "#0079DC" : "#FFF",
                      color: printer == s ? "#fff" : "#000",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                        setAuto(false);
                        setPrinter(s);
                        setAuto(true);
                    }}
                  >
                    <Typography
                      textAlign="center"
                      fontSize={{ xs: "1rem", md: "1.5rem" }}
                      textTransform={"capitalize"}
                    >
                      {s}
                    </Typography>
                  </Card>
                </Grid2>
              ))}
          </Grid2>
        </Box>
      </Box>
    );
}
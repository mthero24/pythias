"use client";
import {Grid2, Box, Typography, Card} from "@mui/material"
export function Stations({stations, station, setStation, setAuto}){
    return (
      <Box sx={{ display: "flex", flexDirection: "row", paddingTop: "1%" }}>
        <Card
          sx={{
            width: { xs: "99%", sm: "96%", md: "90%" },
            marginBottom: "1%",
            marginLeft: { xs: ".5%", sm: "2%", md: "5%" },
            overflow: {xs:"auto", sm: "hidden"},
            padding: ".5%"
          }}
        >
          <Grid2 container spacing={2}>
            {stations &&
              stations.map((s) => (
                <Grid2 size={{ md: 2, sm: 3, xs: 6 }} key={s}>
                  <Card
                    sx={{
                      padding: { xs: "3%", md: "10%" },
                      background: station == s ? "#0079DC" : "#FFF",
                      color: station == s ? "#fff" : "#000",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                        setAuto(false);
                        setStation(s);
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
        </Card>
      </Box>
    );
}
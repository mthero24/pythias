"use client";
import {Grid2, Box, Typography, Card} from "@mui/material"
import {useState} from "react";
export function Stations({stations, station, setStation }){
    //console.log(station, "station stations")
    return (
      <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <Card
          sx={{
            width: "100%",
            marginBottom: "1%",
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
                        setStation(s);
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
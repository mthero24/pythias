"use client";
import {Card,Typography, Box, Grid2, Button} from "@mui/material";


export function Bins({bins, setOrder, setShowNotes, setBin, setShow, setAction}){

    return (
      <Box
        sx={{
          width: { xs: "99%", sm: "96%", md: "90%" },
          marginLeft: { xs: ".5%", sm: "2%", md: "5%" },
          marginBottom: "2%",
        }}
      >
        <Grid2 container spacing={2}>
          {bins &&
            Object.keys(bins).map((t) => (
              <Grid2
                size={{ xs: 12, sm: 6 }}
                key={t}
                sx={{ width: "100%" }}
              >
                <Card sx={{ width: "100%", minHeight: "100vh" }}>
                  <Typography
                    textAlign={"center"}
                    fontWeight="bold"
                    padding="2%"
                    fontSize={"1.6rem"}
                  >
                    {t == "readyToShip" ? "Ready To Ship" : "In Use"}
                  </Typography>

                  <Box
                    sx={{
                      padding: "2%",
                    }}
                  >
                    <Grid2 container spacing={2}>
                      <Grid2 size={1}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          Bin#
                        </Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 4, md: 2 }}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          PO#
                        </Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 4, md: 2 }}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          Type
                        </Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 3, md: 1 }}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          In Bin{" "}
                        </Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 3, md: 2 }}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          Remaining{" "}
                        </Typography>
                      </Grid2>
                      <Grid2
                        size={{ xs: 3, md: 3, lg: 2 }}
                        display={{ xs: "none", md: "block" }}
                      >
                        <Typography textAlign={"center"} fontWeight="bold">
                          Status{" "}
                        </Typography>
                      </Grid2>
                      <Grid2 size={2} display={{ xs: "none", lg: "block" }}>
                        <Typography textAlign={"center"} fontWeight="bold">
                          Date{" "}
                        </Typography>
                      </Grid2>
                    </Grid2>
                  </Box>
                  {bins[t].map((b, i) => (
                    <Card sx={{ cursor: "pointer", margin: ".4%" }} key={i}>
                      {b.order == undefined? console.log(b.number): ""}
                      {b.order &&
                      <Box
                        sx={{
                          padding: "2%",
                          background:
                            new Date(b.order?.date) <
                            new Date(Date.now() - 3 * (24 * 60 * 60 * 1000))
                              ? "#B80F0A"
                              : i % 2 == 0
                                ? "#d2d2d2"
                                : "#e2e2e2",
                          color: new Date(b.order?.date) <
                          new Date(Date.now() - 3 * (24 * 60 * 60 * 1000))
                            ? "#ffffff"
                            : "#000000"
                        }}
                        onClick={() => {
                          if(b.order.notes.length > 0) setShowNotes(true)
                          setOrder(b.order);
                          setBin(b)
                          setShow(true)
                          if(t == "readyToShip") setAction("ship")
                        }}
                      >
                        <Grid2 container spacing={2}>
                          <Grid2 size={1}>
                            <Typography textAlign={"center"} fontWeight="bold">
                              {b.number}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 4, md: 2 }}>
                            <Typography textAlign={"center"} fontWeight="bold">
                              {b.order?.poNumber}
                            </Typography>
                          </Grid2>
                            <Grid2 size={{ xs: 4, md: 2 }}>
                              <Typography textAlign={"center"} fontWeight="bold">
                                {b.order?.shippingType}
                              </Typography>
                            </Grid2>
                          <Grid2 size={{ xs: 3, md: 1 }}>
                            <Typography textAlign={"center"} fontWeight="bold">
                              {b.items.length}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 3, md: 2 }}>
                            <Typography textAlign={"center"} fontWeight="bold">
                              {b.order.items.filter(
                                (i) => i.canceled == false && i.shipped == false
                              ).length - b.items.length}
                            </Typography>
                          </Grid2>
                          <Grid2
                            size={{ xs: 3, md: 3, lg: 2 }}
                            display={{ xs: "none", md: "block" }}
                          >
                            <Typography textAlign={"center"} fontWeight="bold">
                              {b.order.status}
                            </Typography>
                          </Grid2>
                          <Grid2 size={2} display={{ xs: "none", lg: "block" }}>
                            <Typography textAlign={"center"} fontWeight="bold">
                              {new Date(b.order.date).toLocaleDateString(
                                "En-us"
                              )}
                            </Typography>
                          </Grid2>
                        </Grid2>
                      </Box>
                      }
                    </Card>
                  ))}
                </Card>
              </Grid2>
            ))}
        </Grid2>
      </Box>
    );
}
import {Box, Typography} from "@mui/material";

export function FeedBack({shippedCount, binnedCount, setAuto}){
    return (
      <Box
        onClick={() => {
          setAuto(true);
        }}
      >
        <Typography textAlign={"center"} fontWeight={"bold"}>
          Shipped: {shippedCount ? shippedCount : 0} Orders <br /> Binned:{" "}
          {binnedCount ? binnedCount : 0} Items
        </Typography>
      </Box>
    );
}
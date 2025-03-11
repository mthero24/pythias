"use client";
import {
  Card,
  Box,
  Grid2,
  Typography,
  Button,
  Fab,
  TextField,
  ButtonGroup
} from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import {useEffect, useState} from "react";
import axios from "axios";
import {Sort} from "../functions/sort";
import { UntrackedLabels } from "./untracked";
export function Main({labels, rePulls, giftLabels=[], batches, source}){
    const [useLabels, setLabels] = useState(labels);
    const [rePull, setRePulls] = useState(rePulls);
    const [gift, setGiftLabels] = useState(giftLabels);
    const [batch, setBatches] = useState(batches);
    const [selected, setSelected] = useState([]);
    const [restore, setRestore] = useState(false);
    const [showUntracked, setShoeUntracked] = useState(false);
    const [filter, setFilter] = useState();
    const [returnToQue, setReturnToQue] = useState("");
    useEffect(()=>{
      const getUpdate = async()=>{
        console.log("run Get update")
        console.log("getting update")
        let res = await axios.get("/api/production/print-labels/updatePage")
        if(!res.data || res.data.error) alert("could not update page")
        else{
          console.log(res.data)
          setLabels(res.data.labels);
          setBatches(res.data.batches);
          setGiftLabels(res.data.giftMessages)
          setRePulls(res.data.rePulls)
        } 
        await new Promise((resolve) => {
          setTimeout(
            () => {
              resolve();
            },
            5 * (60 * 1000)
          );
        });
        getUpdate()
      }
      getUpdate()
    },[])
    const select = (pieceId)=>{
        let sel = [...selected];
        if(sel.includes(pieceId)){
            sel = sel.filter(s=> s !== pieceId)
        }else{
            sel.push(pieceId)
        }
        setSelected([...sel])
    }
    const selectAllMarketPlaceOrders = ()=>{
        let sel = [...selected]
        Object.keys(useLabels).map((l, i) => {
          sel.push(
            ...useLabels[l].map((k) => {
              if (k.order.poNumber.includes("RT") && k.inventory?.quantity > 0)
                return k.pieceId;
            })
          );
        });
        sel = sel.filter(s=> s != undefined)
        console.log(sel)
         setFilter("RT1");
        setSelected([...sel])
    }
    
    const print = async (type)=>{
        let items = [];
        if(type == "selected"){
            Object.keys(useLabels).map(l=>{
                items.push(...useLabels[l].filter(s=> selected.includes(s.pieceId)));
            })
            items = Sort(items);
        }else if(type == "gift"){
            items = gift
        }else {
            items.push(...useLabels[type].map(s=> {
                if(s.inventory?.quantity > 0) return s}));
            items = items.filter(s=> s != undefined)
            items = Sort(items);
        }
        //console.log(items);
        //console.log(items);
        let res = await axios.post("/api/production/print-labels", {items})
        console.log(res.data)
        if(res.data.error) alert(res.data.msg)
        else{
            setLabels(res.data.labels);
            setBatches(res.data.batches);
            setGiftLabels(res.data.giftMessages)
            setRePulls(res.data.rePulls)
            setSelected([])
            setFilter()
        }
    }
    const restorePrint = async (options)=>{
        let res = await axios.post("/api/production/print-labels/restore", options)
        console.log(res.data)
        if(res.data.error) alert(res.data.msg)
        else{
            setLabels(res.data.labels);
            setBatches(res.data.batches);
            setGiftLabels(res.data.giftMessages)
            setRePulls(res.data.rePulls)
            setSelected([])
            setRestore(false)
        }    
    }
    const returnToQueFunc = async ()=>{
      let res = await axios.post("/api/production/print-labels/return-to-que", {pieceId: returnToQue})
      if(res.data.error) alert(res.data.msg)
      else{
        setLabels(res.data.labels);
        setBatches(res.data.batches);
        setGiftLabels(res.data.giftMessages)
        setRePulls(res.data.rePulls)
        setReturnToQue("")
      }
    }
    const returnInventory = async ()=>{
      let res = await axios.put("/api/production/print-labels/return-to-que", {pieceId: returnToQue})
      if(res.data.error) alert(res.data.msg)
      else{
        setLabels(res.data.labels);
        setBatches(res.data.batches);
        setGiftLabels(res.data.giftMessages)
        setRePulls(res.data.rePulls)
        setReturnToQue("")
      }
    }
    let row = {
        display: "flex",
        flexDirection: "row",
        padding: ".5%",
        width: "100%",
        textAlign: "center"
    }
    let topButtons={
        margin: "0% 1%",
        padding: "1%", 
        background: "#0097DC",
        color: "#fff",
        width: "25%"
    }
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          alignItems: "center",
          margin: ".1%",
          background: "#d2d2d2",
          padding: ".5%",
          minHeight: "100vh",
        }}
      >
        {selected.length > 0 && (
          <Fab
            color="primary"
            variant="extended"
            aria-label="add"
            sx={{
              margin: 0,
              top: "auto",
              right: "45%",
              bottom: 20,
              left: "auto",
              position: "fixed",
            }}
            onClick={()=>{print("selected")}}
          >
            <PrintIcon /> Print Selected
          </Fab>
        )}
        <Card sx={{ width: "100%", marginBottom: ".5%" }}>
          <Box sx={{ ...row, justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 900 }}>
              RePulled: {rePulls ? rePulls : 0}
            </Typography>
            <Box>
              <TextField label="Return Product To Inventory" value={returnToQue} onChange={()=>{setReturnToQue(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter" || event.key == "ENTER") returnInventory()}}/>
            </Box>
            <Box>
              <TextField label="Return Label to Que" value={returnToQue} onChange={()=>{setReturnToQue(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter" || event.key == "ENTER") returnToQueFunc()}}/>
              <Typography fontSize=".6rem" color="red">Resets Inventory To Zero</Typography>
            </Box>
          </Box>
          <Box sx={{ ...row, justifyContent: source == "PP"?"space-between": "center" }}>
            <Button sx={{...topButtons, display: source == "PP"? "none": "block"}} onClick={()=>{print("gift")}}>Print Gift Labels: {gift.length}</Button>
            <Button
              sx={topButtons}
              onClick={() => {
                setRestore(!restore);
              }}
            >
              Restore Que
            </Button>
            <Button sx={{...topButtons}} onClick={()=>{setShoeUntracked(!showUntracked)}}>View Untracked Labels</Button>
            <Button sx={{...topButtons, display: source == "PP"? "none": "block"}} onClick={selectAllMarketPlaceOrders}>
              Select All Market Place Orders
            </Button>
              <ButtonGroup>
                <TextField type="date" onChange={()=>{
                  let sel = []
                  Object.keys(useLabels).map((l, i) => {
                    sel.push(
                      ...useLabels[l].map((k) => {
                        console.log(new Date(k.order.date),  new Date(event.target.value), new Date(k.order.date) > new Date(event.target.value))
                        if (new Date(k.order.date) > new Date(event.target.value) && new Date(k.order.date) < new Date(new Date(event.target.value).getTime() + 24 * (60 * 60 * 1000)))
                          return k.pieceId;
                      })
                    );
                  });
                  sel = sel.filter(s=> s != undefined)
                  console.log(sel)
                  setSelected([...sel])
                }}/>
                <Button size="small" sx={{...topButtons, display: source == "PP"? "block": "none"}} onClick={selectAllMarketPlaceOrders}>
                  Select
                </Button>
              </ButtonGroup>
          </Box>
        </Card>
        {restore && (
          <Card sx={{ padding: "1%", width: "100%", marginBottom: ".5%" }}>
            <Grid2 container spacing={2}>
              {batch &&
                batch.map((batch) => (
                  <Grid2 size={{ xs: 12, sm: 3 }} key={batch._id}>
                    <PrintBatchComponent batch={batch} restorePrint={restorePrint} />
                  </Grid2>
                ))}
            </Grid2>
          </Card>
        )}
        {showUntracked && (
            <Card sx={{ padding: "1%", width: "100%", marginBottom: ".5%" }}>
                <UntrackedLabels/>
            </Card>
        )}
        <Grid2 container spacing={1} sx={{ width: "100%" }}>
          {useLabels &&
            Object.keys(useLabels).map((l, i) => (
              <Grid2 size={{ xs: 12, sm: 6, md: 6, lg: 6 }} key={i}>
                <Card sx={{ width: "100%", minHeight: "100vh" }}>
                  <Typography
                    sx={{ padding: "2%", fontSize: "2rem", fontWeight: 900 }}
                  >
                    {l} Labels ({useLabels[l].length})
                  </Typography>
                  <Box sx={row}>
                    <Button
                        onClick={()=>{print(l)}}
                        sx={{
                            background: "#f2f2f2",
                            margin: ".2%",
                            color: "#000",
                            "&:hover": { background: "#0079DC", color: "#fff" },
                        }}
                    >
                      Print All {l}
                    </Button>
                  </Box>
                  <Box sx={{ padding: ".5%" }}>
                    <TextField
                      fullWidth
                      value={filter}
                      label="Filter"
                      onChange={() => {
                        setFilter(event.target.value);
                      }}
                    />
                  </Box>
                  <Grid2
                    container
                    spacing={1}
                    sx={{ padding: "3%", background: "#0079DC", color: "#fff" }}
                  >
                    <Grid2 size={1}>
                      <Typography sx={{ textAlign: "center" }}>
                        In Stock
                      </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
                      <Typography sx={{ textAlign: "center" }}>
                        Piece ID
                      </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 5, sm: 4, md: 3 }}>
                      <Typography sx={{ textAlign: "center" }}>
                        PO Number
                      </Typography>
                    </Grid2>
                    <Grid2
                      size={{ xs: 1, sm: 3, md: 2, lg: 1 }}
                      sx={{ display: { xs: "none", sm: "block" } }}
                    >
                      <Typography sx={{ textAlign: "center" }}>
                        Style
                      </Typography>
                    </Grid2>
                    <Grid2
                      size={{ xs: 1, md: 2 }}
                      sx={{ display: { xs: "none", sm: "none", md: "block" } }}
                    >
                      <Typography sx={{ textAlign: "center" }}>
                        Color
                      </Typography>
                    </Grid2>
                    <Grid2
                      size={{ xs: 1, md: 1 }}
                      sx={{ display: { xs: "none", sm: "none", md: "block" } }}
                    >
                      <Typography sx={{ textAlign: "center" }}>Size</Typography>
                    </Grid2>
                    <Grid2
                      size={{ xs: 1, lg: 1 }}
                      sx={{
                        display: {
                          xs: "none",
                          sm: "none",
                          md: "none",
                          lg: "block",
                        },
                      }}
                    >
                      <Typography sx={{ textAlign: "center" }}>Date</Typography>
                    </Grid2>
                  </Grid2>
                  {useLabels[l]
                    .filter((s) => {
                      if (filter) {
                        if (
                          s.pieceId
                            .toLowerCase()
                            .includes(filter.toLowerCase()) ||
                          s.order.poNumber
                            .toLowerCase()
                            .includes(filter.toLowerCase()) ||
                          s.styleCode
                            .toLowerCase()
                            .includes(filter.toLowerCase()) 
                        )
                          return s;
                      } else return s;
                    })
                    .filter((s) => s !== undefined)
                    .map((i, j) => (
                      <Card
                        onClick={() => {
                          select(i.pieceId);
                        }}
                        key={j}
                      >
                        <Grid2
                          container
                          spacing={1}
                          sx={{
                            padding: "3%",
                            background: selected.includes(i.pieceId)
                              ? "#0079DC"
                              : j % 2 == 0
                                ? "#e2e2e2"
                                : "#f2f2f2",
                            cursor: "pointer",
                            color: selected.includes(i.pieceId)
                              ? "#fff"
                              : "#000",
                          }}
                        >
                          <Grid2 size={1}>
                            <Typography
                              sx={{
                                textAlign: "center",
                                color: i.inventory
                                  ? i.inventory.quantity > 0
                                    ? "#228C22"
                                    : i.inventory.quantity +
                                          i.inventory.pending_quantity >
                                        0
                                      ? "#feb204"
                                      : "#d0342c"
                                  : "#d0342c",
                              }}
                            >
                              {i.inventory
                                ? i.inventory.quantity +
                                  i.inventory.pending_quantity
                                : 0}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
                            <Typography sx={{ textAlign: "center" }}>
                              {i.pieceId}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 5, sm: 4, md: 3 }}>
                            <Typography sx={{ textAlign: "center" }}>
                              {i.order.poNumber}
                            </Typography>
                          </Grid2>
                          <Grid2
                            size={{ xs: 1, sm: 3, md: 2, lg: 1 }}
                            sx={{ display: { xs: "none", sm: "block" } }}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {i.styleCode}-{i.type}
                            </Typography>
                          </Grid2>
                          <Grid2
                            size={{ xs: 1, md: 2 }}
                            sx={{
                              display: { xs: "none", sm: "none", md: "block" },
                            }}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {i.colorName?.split("/")[0]}
                            </Typography>
                          </Grid2>
                          <Grid2
                            size={{ xs: 1, md: 1 }}
                            sx={{
                              display: { xs: "none", sm: "none", md: "block" },
                            }}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {i.sizeName}
                            </Typography>
                          </Grid2>
                          <Grid2
                            size={{ xs: 1, lg: 1 }}
                            sx={{
                              display: {
                                xs: "none",
                                sm: "none",
                                md: "none",
                                lg: "block",
                              },
                            }}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {new Date(i.date).toLocaleDateString("En-us")}
                            </Typography>
                          </Grid2>
                        </Grid2>
                      </Card>
                    ))}
                </Card>
              </Grid2>
            ))}
        </Grid2>
      </Box>
    );
}

const PrintBatchComponent = ({ batch, restorePrint }) => {
  const [lastIndexPrinted, setLastIndexPrinted] = useState(0);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        py: "8px",
      }}
    >
        <Box>
            <Typography>ID: {batch.batchID}</Typography>
            <Typography>DATE: {new Date(batch.date).toLocaleString()}</Typography>
            <Typography>COUNT: {batch.count}</Typography>
        </Box>
        <Box>
            <TextField
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                label="Last Index Printed"
                value={lastIndexPrinted}
                sx={{marginBottom: "1%"}}
                onKeyDown={()=>{if(event.key == 13 || event.key == "Enter") restorePrint({batchID: batch.batchID, lastIndex: lastIndexPrinted})}}
                onChange={(e) => setLastIndexPrinted(e.target.value)}
                
            />
            <Button fullWidth sx={{background: "#0079CD", color: "#fff"}}onClick={() => restorePrint({batchID: batch.batchID, lastIndex: lastIndexPrinted})}>Reprint</Button>
        </Box>
    </Box>
  );
};
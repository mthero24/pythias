"use client";
import {
  Card,
  Box,
  Grid2,
  Typography,
  Button,
  Fab,
  Select,
  TextField,
  MenuItem,
  ButtonGroup,
  InputLabel 
} from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';
import {useEffect, useState} from "react";
import axios from "axios";
import {Sort} from "../functions/sort";
import { UntrackedLabels } from "./untracked";
import { Footer } from "@pythias/backend";
import { set } from "mongoose";
import LoaderOverlay from "./LoaderOverlay";
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
    const [returnToInv, setReturnToInv] = useState("");
    const [printTypes, setPrintTypes] = useState([])
    const [printTypeSelected, setPrintTypeSelected] = useState("Select")
    const [styleCodeSelected, setStyleCodeSelected] = useState("Select")
    const [styleCodes, setStyleCodes] = useState([])
    const [loading, setLoading] = useState(false)
    useEffect(()=>{
      let pt = []
      let sc = []
      for(let lab of labels["Standard"]){
        if(!pt.includes(lab.type?.toUpperCase())) pt.push(lab.type?.toUpperCase())
        if(!sc.includes(lab.styleCode)) sc.push(lab.styleCode)
      }
      setPrintTypes(pt)
      setStyleCodes(sc)
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
        if(printTypeSelected != "Select" || styleCodeSelected != "Select"){
          setPrintTypeSelected("Select")
          setStyleCodeSelected("Select")
          selectBasedOnPTSC({printType: "Select"})
        }
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
              if (k.order.poNumber.includes("RT") && k.inventory?.inventory?.quantity > 0)
                return k.pieceId;
            })
          );
        });
        sel = sel.filter(s=> s != undefined)
        console.log(sel)
         setFilter("RT1");
        setSelected([...sel])
    }
    const selectBasedOnPTSC = ({printType, styleCode})=>{
      let sel = []
      console.log(printTypeSelected)
      if(printType && printType!= "Select" && styleCodeSelected && styleCodeSelected != "Select"){
        Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                if ((k.type?.toLowerCase() == printType.toLowerCase()) && k.styleCode == styleCodeSelected && k.inventory?.inventory?.quantity > 0)
                    if(k.inventory.inventory.inStock){
                      if(k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                    }else return k.pieceId;
              })
            );
        });
      }else if(printType == "Select" && styleCodeSelected != "Select"){
        Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                if ((k.styleCode == styleCodeSelected) && k.k.inventory?.inventory?.quantity > 0)
                  if (k.inventory.inventory.inStock) {
                    if (k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                  } else return k.pieceId;
              })
            );
        });
      }else if(printType){
        Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                console.log(k.type?.toLowerCase() || k.designRef?.printType?.toLowerCase())
                if (((k.type?.toLowerCase() || k.designRef?.printType?.toLowerCase()) == printType.toLowerCase()) && k.inventory?.inventory?.quantity > 0)
                  if (k.inventory.inventory.inStock) {
                    if (k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                  } else return k.pieceId;
              })
            );
        });
      }
      if(styleCode && styleCode != "Select" && printTypeSelected && printTypeSelected != "Select"){
        console.log("here")
        Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                if ((k.type == printTypeSelected) && k.styleCode == styleCode && k.inventory?.inventory?.quantity > 0)
                  if (k.inventory.inventory.inStock) {
                    if (k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                  } else return k.pieceId;
              })
            );
        });
      }else if(styleCode == "Select" && printTypeSelected != "Select"){
        console.log("here")
         Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                if ((k.type?.toLowerCase() == printTypeSelected.toLowerCase()) && k.inventory?.inventory?.quantity > 0)
                  if (k.inventory.inventory.inStock) {
                    if (k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                  } else return k.pieceId;
              })
            );
        });
      }else if(styleCode){
        console.log("here or here")
        Object.keys(useLabels).map((l, i) => {
            sel.push(
              ...useLabels[l].map((k) => {
                if ((k.styleCode == styleCode) && k.inventory?.quantity > 0)
                  if (k.inventory.inventory.inStock) {
                    if (k.inventory.inventory.inStock.includes(k._id)) return k.pieceId;
                  } else return k.pieceId;
              })
            );
        });
      }
      console.log(sel)
      sel = sel.filter(s=> s != undefined)
      console.log(sel)
      setSelected([...sel])
    }
    const print = async (type)=>{
      setLoading(true)
        let items = [];
        if(type == "selected"){
            Object.keys(useLabels).map(l=>{
              items.push(...useLabels[l].filter(s => selected.includes(s.pieceId)));
            })
            items = Sort(items, source);
        }else if(type == "gift"){
            items = gift
        }else {
          console.log()
            if(source == "PP"){
              items.push(...useLabels[type]);
            }else{
                let inventories = [];
              for(let l of useLabels[type]){
                if(l.inventory.inventoryType == "inventory" && !inventories.filter(i=> i?._id?.toString() == l.inventory.inventory?._id?.toString())[0]) inventories.push({...l.inventory.inventory})
                else if(l.inventory.inventoryType == "productInventory" && !inventories.filter(i=> i?._id?.toString() == l.inventory.productInventory?._id?.toString())[0]) inventories.push({...l.inventory.productInventory})
              }
              for(let l of useLabels[type]){
                let inventory 
                if(l.inventoryType == "productInventory"){
                  inventory = inventories.filter(i=> i?._id?.toString() == l.inventory.productInventory?._id?.toString())[0]
                }else if(l.inventoryType != "inventory" ){
                  inventory = inventories.filter(i => i?._id?.toString() == l.inventory.inventory?._id?.toString())[0]
                } 
                if(inventory.quantity > 0){
                  items.push(l)
                  inventory.quantity -= 1;
                }
              }
              console.log(items.length)
            }
            items = Sort(items, source);
            console.log(items.length, "items length")
        } 
        console.log(items);
        console.log(items);
        let res = await axios.post("/api/production/print-labels", {items})
        console.log(res.data)
        if(res.data.error) alert(res.data.msg)
        else{
          setLoading(false)
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
      let res = await axios.put("/api/production/print-labels/return-to-que", {pieceId: returnToInv})
      if(res.data.error) alert(res.data.msg)
      else{
        setLabels(res.data.labels);
        setBatches(res.data.batches);
        setGiftLabels(res.data.giftMessages)
        setRePulls(res.data.rePulls)
        setReturnToInv("")
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
      <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          alignItems: "center",
          margin: ".1%",
          background: "#d2d2d2",
          padding: ".5%",
          minHeight: "70vh",
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
              RePulled: {rePull ? rePull : 0}
            </Typography>
            <Box>
              <TextField label="Return Product To Inventory" value={returnToInv} onChange={()=>{setReturnToInv(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key == "Enter" || event.key == "ENTER") returnInventory()}}/>
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
                        console.log(new Date(k.order.date).toLocaleDateString("en-US"),  new Date(new Date(event.target.value).getTime() + (24 * 60 * 60 * 1000)).toLocaleDateString("en-US"), new Date(k.order.date).toLocaleDateString("en-US") == new Date(event.target.value))
                        if (new Date(k.order.date).toLocaleDateString("en-US") == new Date(new Date(event.target.value).getTime() + (24 * 60 * 60 * 1000)).toLocaleDateString("en-US"))
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
        
        <Card sx={{display: "flex", width: "100%", padding: "2%", flexDirection: "row", margin: ".5%", justifyContent: "space-between"}}>
          <Box sx={{width: "30%"}}>
            <InputLabel id="demo-simple-select-label">Print Type</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              label="Print Type"
              value={printTypeSelected}
              onChange={()=>{
                console.log(event.target.dataset.value)
                setPrintTypeSelected(event.target.dataset.value)
                selectBasedOnPTSC({printType: event.target.dataset.value})
              }}
              sx={{width: "100%"}}
            >
              <MenuItem value={"Select"}>Select</MenuItem>
              {printTypes.map(pt=>(
                <MenuItem value={pt}>{pt}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography>{selected.length > 0? `Labels Selected: ${selected.length}`: ""}</Typography>
          </Box>
          <Box sx={{width: "30%"}}>
            <InputLabel id="demo-simple-select-label">Style Code</InputLabel>
            <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={styleCodeSelected}
            label="Blank Type"
            sx={{width: "100%"}}
            onChange={()=>{
              console.log(event.target.dataset.value)
              setStyleCodeSelected(event.target.dataset.value)
              selectBasedOnPTSC({styleCode: event.target.dataset.value})
            }}
          >
            <MenuItem value={"Select"}>Select</MenuItem>
            {styleCodes.map(pt=>(
              <MenuItem value={pt}>{pt}</MenuItem>
            ))}
          </Select>
          </Box>
        </Card>
      <Grid2 container spacing={1} sx={{ width: "100%", marginBottom: "1%" }}>
          {useLabels &&
            Object.keys(useLabels).map((l, i) => (
              <Grid2 size={{ xs: 12, sm: source == "IM"? 12: 6, md:  source == "IM"? 12: 6, lg:  source == "IM"? 12: 6 }} key={i}>
                <Card sx={{ width: "100%", minHeight: "100vh" }}>
                  {source != "PO" && <Typography
                    sx={{ padding: "2%", fontSize: "2rem", fontWeight: 900 }}
                  >
                    {l} In Stock ({useLabels[l].filter(l => (l.inventory?.inventoryType == "inventory" && l.inventory?.inventory?.inStock?.includes(l._id.toString())) ).length})
                    <br/>
                    Out Of Stock ({useLabels[l].filter(l => (l.inventory?.inventoryType == "inventory" && !l.inventory?.inventory?.inStock?.includes(l._id.toString()))).length})
                  </Typography>}
                  {/* {source == "PO" && <Typography
                    sx={{ padding: "2%", fontSize: "2rem", fontWeight: 900 }}
                  >
                    {l} In Stock ({useLabels[l].filter(l => (l.inventory?.inventoryType == "inventory" && l.inventory?.inventory?.inStock.includes(l._id.toString())) ).length})
                    <br/>
                    Out Of Stock ({useLabels[l].filter(l => (l.inventory?.inventoryType == "inventory" && !l.inventory?.inventory?.inStock.includes(l._id.toString()))).length})
                  </Typography>} */}
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
                    <Grid2 size={2}>
                      <Typography sx={{ textAlign: "center" }}>
                        In Stock
                      </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: source == "IM"? 2: 4, md: source == "IM"? 1: 2 }}>
                      <Typography sx={{ textAlign: "center" }}>
                        Piece ID
                      </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 5, sm: source == "IM"? 2: 4, md: source == "IM"? 2: 3 }}>
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
                    {source == "IM" && <Grid2
                      size={{ xs: 1, md: 2 }}
                      sx={{ display: { xs: "none", sm: "none", md: "block" } }}
                    >
                      <Typography sx={{ textAlign: "center" }}>
                        Thread Color
                      </Typography>
                    </Grid2>}
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
                          <Grid2 size={2}>
                            <Typography
                              sx={{
                                textAlign: "center",
                                color: i.inventory?.inventoryType == "inventory" ? i.inventory?.inventory?.inStock && i.inventory?.inventory?.inStock.includes(i._id.toString()) ? "#228C22" : i.inventory?.inventory?.orders?.map(o=> o.items.includes(i._id.toString())).filter(i => i != undefined)[0] ? "#ffa808ff" : "#d0342c" : "#d0342c",
                              }}
                            >
                              {i.inventory && i.inventory.inventoryType == "inventory" && i.inventory.inventory && i.inventory.inventory.inStock && i.inventory.inventory.inStock.includes(i._id.toString())?  "In Stock" : i.inventory && !i.inventory.inventory?.inStock ? i.inventory.inventory?.quantity > 0 ? "In Stock": "Out Of Stock" : "Out Of Stock" }
                              <br/>
                              {i.inventory && i.inventory.inventoryType == "inventory" && i.inventory.inventory && i.inventory.inventory.inStock ? `Pending:  ${i.inventory.inventory.inStock?.length}`: "" }
                              <br/>
                              {i.inventory && i.inventory.inventoryType == "inventory" && i.inventory.inventory && i.inventory.inventory.attached ? `Need:  ${i.inventory.inventory.attached?.length}` : ""}
                              <br/>
                              {i.inventory && i.inventory.inventoryType == "inventory" && i.inventory.inventory && i.inventory.inventory.orders ? `Ordered ${i.inventory.inventory.orders?.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0)}` : ""}
                              <br/>
                              {i.inventory && i.inventory.inventoryType == "inventory" && i.inventory.inventory && i.inventory.inventory.quantity ? `Total Stock: ${i.inventory.inventory?.quantity}`: "" }
                              {/* {i.inventory?.inventoryType == "productInventory" ? `Returns ${i.inventory?.productInventory?.quantity - (i.inventory?.productInventory?.onhold ? i.inventory?.productInventory?.onhold : 0)}` : i.inventory?.inventoryType == "inventory" ? `${i.inventory?.inventory?.quantity - (i.inventory?.inventory?.onhold ? i.inventory?.inventory?.onhold : 0) > 0 ? "In Stock" : "Out Of Stock"} ${i.inventory?.inventory?.quantity - (i.inventory?.inventory?.onhold ? i.inventory?.inventory?.onhold : 0)} (pending: ${i.inventory?.inventory?.pending_quantity}) (${i.inventory?.inventory?.orders?.map(o => o.items.includes(i._id.toString())).filter(i => i != undefined)[0] ? "orderd" : "not orderd yet"})` : "Out Of Stock"} */}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 6, sm: source == "IM"? 2: 4, md: source == "IM"? 1: 2 }}>
                            <Typography sx={{ textAlign: "center" }}>
                              {i.pieceId}
                            </Typography>
                          </Grid2>
                          <Grid2 size={{ xs: 5, sm: source == "IM"? 2: 4, md: source == "IM"? 2:3 }}>
                            <Typography sx={{ textAlign: "center" }}>
                              {i.order?.poNumber}
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
                          {source == "IM" && <Grid2
                            size={{ xs: 1, md: 2 }}
                            sx={{
                              display: { xs: "none", sm: "none", md: "block" },
                            }}
                          >
                            <Typography sx={{ textAlign: "center" }}>
                              {i.threadColorName?.split("/")[0]} {i.designRef?.sku}
                            </Typography>
                          </Grid2>}
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
        {loading && <LoaderOverlay />}
      </Box>
        <Footer />
      </>
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
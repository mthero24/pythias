"use client";
import { Manifest } from "./manifest";
import {Stations} from "./stations";
import {Bins} from "./bins";
import {Scan} from "./scan";
import { OrderModal } from "./orderModal";
import {useState, useEffect} from "react";
import {Box} from "@mui/material"
//import { useWindowSize } from "../exports";
export function Main({stations, binCount, bins}){
    const [station, setStation] = useState(stations? stations[0]: "station1");
    const [order, setOrder] = useState();
    const [item, setItem] = useState();
    const [bin, setBin] = useState();
    const [binss, setBins] = useState(bins)
    const [auto, setAuto] = useState(true)
    const [size, setSize] = useState({width: 900, height: 900})
    const [show, setShow] = useState(false)
    //const { width, height } = useWindowSize();
    useEffect(()=>{
      if(typeof window != "undefined"){
        setSize({width: window.innerWidth, height: window.innerHeight})
      }
      let handleResize = ()=>{
        if (typeof window != "undefined") {
          setSize({ width: window.innerWidth, height: window.innerHeight });
        }
      }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },[])
    let modalStyle = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: size.width - 100,
      height: size.height - 100,
      bgcolor: "background.paper",
      border: "2px solid #000",
      boxShadow: 24,
      p: 4,
    };
    return (
      <Box>
        <Manifest binCount={binCount} setAuto={setAuto} setBins={setBins} modalStyle={modalStyle}/>
        <Stations
          stations={stations}
          station={station}
          setStation={setStation}
          setAuto={setAuto}
        />
        <Scan auto={auto} setAuto={setAuto} setOrder={setOrder} setItem={setItem} setBin={setBin} setShow={setShow}/>
        <Bins
          bins={binss}
          setBins={setBins}
          setOrder={setOrder}
          setAuto={setAuto}
        />
        <OrderModal order={order} setOrder={setOrder} item={item} setItem={setItem} bin={bin} setBin={setBin} style={modalStyle} show={show} setShow={setShow} />
      </Box>
    );
}
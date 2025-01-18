"use client";
import { Manifest } from "./manifest";
import {Stations} from "./stations";
import {Bins} from "./bins";
import {Scan} from "./scan";
import {useState, useEffect} from "react";
import {Box} from "@mui/material"
export function Main({stations, binCount, bins}){
    const [station, setStation] = useState(stations? stations[0]: "station1");
    const [order, setOrder] = useState();
    const [binss, setBins] = useState(bins)
    const [auto, setAuto] = useState(true)
    return (
      <Box>
        <Manifest binCount={binCount} setAuto={setAuto} />
        <Stations
          stations={stations}
          station={station}
          setStation={setStation}
          setAuto={setAuto}
        />
        <Scan auto={auto} setAuto={setAuto} />
        <Bins
          bins={binss}
          setBins={setBins}
          setOrder={setOrder}
          setAuto={setAuto}
        />
      </Box>
    );
}
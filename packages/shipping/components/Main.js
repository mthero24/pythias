"use client";
import { Manifest } from "./manifest";
import {Stations} from "./stations";
import {Scan} from "./scan";
import {useState} from "react";
export function Main({stations}){
    const [station, setStation] = useState(stations? stations[0]: "station1");
    return (
        <>
            <Manifest/>
            <Stations stations={stations} station={station} setStation={setStation} />
            <Scan />
        </>
    )
}
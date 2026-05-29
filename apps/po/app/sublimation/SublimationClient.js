"use client";
import { useState } from "react";
import { Main, Stations } from "@pythias/sublimation/client";

export default function SublimationClient({ labels, stations, stat }) {
  const [station, setStation] = useState(stat || stations?.[0] || "station1");
  return (
    <>
      <Stations stations={stations} station={station} setStation={setStation} />
      <Main labels={labels} station={station} />
    </>
  );
}

"use client";
import { useState, useEffect } from "react";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined"? window.innerWidth: 600,
    height: typeof window !== "undefined"? window.innerHeight: 600,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: typeof window !== "undefined" ? window.innerWidth : 600,
        height: typeof window !== "undefined" ? window.innerHeight : 600,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
